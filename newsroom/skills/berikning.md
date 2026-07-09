# Skill: Berikning — bilder, video och länkar

En artikel ska vara mer än text. Så berikar du den.

## Huvudbild (`image`)

- Förstahandsval: källartikelns egen toppbild (og:image) — den följer med i källmaterialet när den finns.
- Finns ingen användbar bild: föreslå en söksträng i fältet `imageQuery` (engelska, 2–4 ord, t.ex. "neural network abstract") så att redaktionen kan hämta en fri bild från t.ex. Unsplash.
- Använd aldrig bilder på identifierbara personer utan att källan gör det i samma sammanhang.

## Video

- Finns en relevant YouTube-video (demo, keynote, trailer) i källmaterialet: ta med den i `media` som `{ "type": "youtube", "url": "..." }`. Appens artikelvy kan bädda in YouTube.
- Bädda bara in video som tillför något — ingen video för videons skull.

## Inlägg från X

- Relevanta X-inlägg (uttalanden från grundare, demos) tas med i `media` som `{ "type": "tweet", "url": "https://x.com/..." }`. Appen kan rendera tweets.

## Länkar

- Länka produktnamn, bolag och rapporter till sina officiella sidor i löptexten (`<a href>`) — max 3–4 länkar per artikel.
- Länka alltid källartikeln (se skill: omskrivning).
- GitHub-repo, demo eller produktsida som nämns i källan är ofta den mest värdefulla länken för läsaren — ta med den.

## Kreditering

- Bildkälla anges i `media`-postens `credit`-fält när den är känd (t.ex. "Foto: OpenAI").
