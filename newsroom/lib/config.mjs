/**
 * Loads agent definitions, their source indexes and skills from disk.
 *
 * An agent is pure configuration: newsroom/agents/<id>.json describes WHO it
 * is (mission, tag, palette), newsroom/sources/<id>.json describes WHERE it
 * looks, and the markdown files in newsroom/skills/ describe HOW it writes.
 * The pipeline code is shared — adding an agent means adding two JSON files.
 */
import { readFileSync, readdirSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url))); // newsroom/

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

export function listAgentIds() {
  return readdirSync(join(ROOT, "agents"))
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .sort();
}

export function loadAgent(id) {
  const agentPath = join(ROOT, "agents", `${id}.json`);
  if (!existsSync(agentPath)) {
    throw new Error(
      `Unknown agent "${id}". Available: ${listAgentIds().join(", ")}`
    );
  }
  const agent = readJson(agentPath);

  const sourcesPath = join(ROOT, "sources", `${id}.json`);
  agent.sources = existsSync(sourcesPath)
    ? readJson(sourcesPath)
    : { feeds: [], sites: [], newsletters: [], x: [] };

  // Concatenate the agent's skill files into one prompt block, in the order
  // they are listed — later skills may refine earlier ones.
  agent.skillsText = (agent.skills || [])
    .map((name) => {
      const p = join(ROOT, "skills", `${name}.md`);
      if (!existsSync(p)) throw new Error(`Agent "${id}" references missing skill "${name}"`);
      return readFileSync(p, "utf8").trim();
    })
    .join("\n\n---\n\n");

  return agent;
}

export const newsroomRoot = ROOT;
