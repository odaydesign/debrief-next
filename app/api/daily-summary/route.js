// Server route: generate a short editorial one-liner summarising the day's
// briefs via OpenAI. Runs on Firebase App Hosting (Node server). The OpenAI
// key is a server-only secret (never shipped to the client). Caching is done
// by the client in Firestore (editions/{date}); this route only generates.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { articles, date } = await request.json();

    if (!Array.isArray(articles) || articles.length === 0) {
      return Response.json({ error: "no articles" }, { status: 400 });
    }

    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
      return Response.json({ error: "missing OPENROUTER_API_KEY" }, { status: 500 });
    }
    const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

    const list = articles
      .slice(0, 10)
      .map((a, i) => `${i + 1}. ${a.title}${a.summary ? ` — ${a.summary}` : ""}`)
      .join("\n");

    const system =
      "Du är redaktör för Debrief, en svensk daglig nyhetsbrief. " +
      "Skriv EN kort, skarp mening (max ~14 ord) som sammanfattar dagens viktigaste nyheter " +
      "och får läsaren att direkt förstå vad de kan vänta sig idag. " +
      "Redaktionell, konkret ton. Svenska. Ingen inledning, inga citattecken, ingen punktlista, inga emojis. Avsluta med punkt.";
    const user = `Dagens briefer (${date || "idag"}):\n${list}\n\nSkriv dagens sammanfattningsmening.`;

    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
        "X-Title": "Debrief",
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        max_tokens: 60,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      return Response.json({ error: "openai_error", detail: detail.slice(0, 300) }, { status: 502 });
    }

    const data = await r.json();
    let summary = (data?.choices?.[0]?.message?.content || "").trim();
    summary = summary.replace(/^["'«»\s]+|["'«»\s]+$/g, "");

    if (!summary) return Response.json({ error: "empty" }, { status: 502 });
    return Response.json({ summary });
  } catch (e) {
    return Response.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
