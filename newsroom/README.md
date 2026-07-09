# Newsroom — Debriefs innehållsagenter

A multi-agent content pipeline for Debrief. Each agent is a specialized
researcher/writer with its own **focus** (AI, design, games, apps, SaaS,
startups, the X conversation), its own **source index** (which sites it
sweeps daily), and a shared set of **skills** (editorial guidelines for how
to write Swedish articles). Agents harvest the internet, read and understand
what they find, and rewrite it in Swedish as draft articles — with images,
video and links attached — for a human editor to review and publish.

```
harvest → dedupe → select → read → write → enrich → publish (draft)
   │         │        │       │       │        │         │
   RSS/     seen-    LLM:    fetch   LLM:    og:image  Firestore
   Atom     URL      triage  page,   Swedish YouTube   articles/
   feeds    ledger   vs      extract article  tweets   status:"draft"
                     mission text    per      links
                             +media  skills
```

## Concepts

**Agent** (`agents/<id>.json`) — pure configuration, no code. Defines the
agent's mission, its tag and visual identity in the app (tagStyle, palette,
buttonText), which skills it writes with, its selection criteria and daily
quota (`maxPerRun`), and optionally a dedicated model. Adding an agent =
adding one JSON file here plus a source index. The pipeline code is shared.

**Source index** (`sources/<id>.json`) — where the agent looks:
- `feeds` — RSS/Atom feeds, swept on every run (works today)
- `newsletters` — newsletter feeds (most Substack/beehiiv letters expose RSS; works today)
- `sites` — sites without feeds; needs a crawler adapter (declared, skipped for now)
- `x` — X/Twitter handles; needs the X adapter (see below)

**Skill** (`skills/<name>.md`) — editorial guidelines written in Swedish,
concatenated into the writing prompt in the order the agent lists them:
- `svensk-nyhetsartikel` — voice, structure, length, the "Varför det spelar roll" closer
- `omskrivning` — rewrite (never translate/copy), quotes, attribution, no fabrication
- `berikning` — main image, YouTube embeds, tweets, links, crediting
- `x-kuratering` — how to curate X threads into articles (x-pulse only)

Skills are the system's editorial contract: tightening how every agent
writes means editing one markdown file.

## Data model

Drafts land in the existing `articles` collection using the exact document
shape the app already renders, plus newsroom fields:

| field | meaning |
|---|---|
| `status` | `"draft"` until an editor promotes it; public surfaces filter drafts out |
| `agent` | which agent wrote it (`"ai"`, `"design"`, …) |
| `source` | `{ name, url }` of the original article |
| `media` | `[{ type: "image"\|"youtube"\|"tweet", url, credit }]` gathered from the source |
| `imageQuery` | suggested stock-photo search if the source had no usable image |
| `generatedAt` | pipeline timestamp |

A `harvest` collection (doc id = normalized-URL hash) is the dedupe ledger,
so the same story is never drafted twice. Locally (or in `--dry-run`) a
gitignored `newsroom/.ledger.json` is used instead.

Draft safety in the app:
- `lib/db.js` filters `status === "draft"` from all public reads and adds
  `api.articles.getAllAdmin` for the dashboard
- `lib/articleServer.js` skips drafts in the sitemap
- the admin dashboard shows drafts with an **UTKAST · \<agent\>** badge
- `/a/<id>` still resolves a draft by direct link — that is the preview URL

## Running

```bash
node newsroom/run.mjs --list                 # what agents exist
node newsroom/run.mjs --agent ai --dry-run   # full pipeline, drafts to newsroom/out/*.json
node newsroom/run.mjs --agent ai             # publish drafts to Firestore (needs gcloud ADC)
node newsroom/run.mjs --all --limit 2        # all agents, max 2 drafts each
node newsroom/promote.mjs --list             # drafts awaiting review
node newsroom/promote.mjs --id <articleId>   # draft → published
node newsroom/promote.mjs --id <id> --reject # delete a draft
```

Environment:

| var | required for | default |
|---|---|---|
| `OPENROUTER_API_KEY` | select + write stages | — (without it the run stops after harvest and prints candidates) |
| `OPENROUTER_MODEL` | model override | `anthropic/claude-sonnet-4.5` |
| `FIREBASE_PROJECT_ID` | publishing | `debrief-3ef06` |
| gcloud ADC + `firebase-admin` installed | publishing (`--dry-run` needs neither) | same setup as `scripts/*.mjs` |

No new runtime dependencies: the harvester and extractor are dependency-free
(built-in `fetch`), the LLM goes through OpenRouter like the existing
`/api/daily-summary` route, and `firebase-admin` is imported lazily only
when actually publishing.

## Review flow

1. Agents run (cron/manually) → drafts appear in the admin dashboard with an UTKAST badge.
2. Editor opens the draft in the editor, adjusts, checks the image.
3. Promote: `node newsroom/promote.mjs --id <id>` (or later, a publish button in the admin UI).

Agents never publish directly to the public feed. The human is the last step
by design — the agents are researchers and writers, not editors-in-chief.

## Scheduling

The runner is a plain Node script, so any scheduler works:
- **GitHub Actions** cron: `node newsroom/run.mjs --all` with
  `OPENROUTER_API_KEY` and a Firebase service-account secret
- **Cloud Scheduler → Cloud Run job** in the same Firebase project (ADC is automatic)
- locally: `npm run newsroom -- --agent ai`

Start with one run per day per agent; quotas (`maxPerRun`) keep volume sane.

## Adding an agent

1. `newsroom/agents/<id>.json` — copy an existing one, set mission/tag/palette/criteria.
2. `newsroom/sources/<id>.json` — its feeds.
3. Optionally a new skill in `newsroom/skills/` if it writes differently.
4. `node newsroom/run.mjs --agent <id> --dry-run` and read the output JSON.

## The X-adapter (and other roadmap)

- **X/Twitter**: there is no open RSS for X. The `x-pulse` agent's handle
  index is in place, but harvesting needs an adapter — X API v2 (paid) or a
  third-party service — that turns timelines into the same
  `{title, url, summary, publishedAt, sourceName}` item shape. Once that
  exists, everything downstream (select/write/publish, the `x-kuratering`
  skill, tweet embeds via the app's `react-tweet`) already works.
- **Email newsletters**: for letters without RSS, a mailbox adapter (e.g. a
  dedicated inbox the agents read) can feed the same pipeline.
- **`sites` crawling**: a lightweight crawler adapter for indexed sites
  without feeds.
- **Better extraction**: swap the regex extractor for `@mozilla/readability`
  behind the same `readPage()` interface if article quality demands it.
- **Image licensing**: `imageQuery` + an Unsplash/Pexels API step could
  auto-fill missing cover images.
- **Admin UI**: publish/reject buttons on the dashboard instead of `promote.mjs`.
