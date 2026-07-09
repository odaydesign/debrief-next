# Skill: X-kuratering

För agenter som bevakar samtalet på X (Twitter) och gör artiklar av det.

## Vad som är värt att kuratera

- Trådar med genuin insikt: förstahandsinformation, teknisk fördjupning, siffror.
- Debatter där flera tunga röster deltar och det finns en tydlig sakfråga.
- Tillkännagivanden som görs först på X, innan pressreleasen.

Hoppa över: engagemangsbete, memes utan sammanhang, gräl, spekulation från anonyma konton.

## Form

- Artikeln är en **kuraterad berättelse**, inte en tweetdump. Förklara sammanhanget: vem säger vad, varför nu, vad står på spel.
- Återge max 3–5 inlägg. Varje inlägg antingen:
  - inbäddat via `media`: `{ "type": "tweet", "url": "https://x.com/anv/status/..." }`, eller
  - citerat i text: `<blockquote>"..." — @handle</blockquote>` med exakt ordalydelse (märk översättningar).
- Namnge alltid avsändaren med handle och roll ("Sam Altman, vd för OpenAI, skriver...").

## Verifiering

- Kontrollera att kontot är den person det utger sig för att vara (verifierat konto, känd handle från källindexet).
- Påståenden i tweets är påståenden — inte fakta. Rapportera dem som uttalanden: "hävdar", "skriver", "enligt".
- Om en tweet raderats eller inte kan verifieras: använd den inte.
