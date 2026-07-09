# Skill: Svensk nyhetsartikel

Så skriver du en artikel för Debrief — en svensk daglig nyhetsbrief om tech.

## Röst och ton

- Redaktionell, konkret, självsäker. Tänk svensk tech-journalistik (Breakit, DI Digital) snarare än pressrelease.
- Skriv på naturlig svenska. Behåll etablerade engelska facktermer (open source, prompt, feature) men undvik onödiga anglicismer när ett bra svenskt ord finns.
- Aktiv form. "OpenAI släpper..." — inte "En ny modell har släppts av...".
- Inga emojis, inga utrop, ingen hajp utan täckning.

## Struktur

**Rubrik** — max ~9 ord. Ska bära nyhetens kärna, gärna med en vinkel eller spänning. Versal endast i första ordet och egennamn.

**Ingress (`summary`)** — 1–2 meningar, max ~30 ord. Ska fungera fristående som kortversion i appens flöde: vad har hänt och varför bryr man sig.

**Brödtext (`contentHtml`)** — 250–450 ord som ren HTML:
- Tillåtna element: `<p>`, `<h2>`, `<ul>`/`<li>`, `<blockquote>`, `<a>`, `<strong>`, `<em>`.
- Första stycket: det viktigaste, utan att upprepa ingressen ordagrant.
- Mellanrubriker (`<h2>`) vid behov, korta (2–4 ord).
- Avsluta alltid med ett kort stycke under `<h2>Varför det spelar roll</h2>` — sätt nyheten i sammanhang för en svensk läsare (marknaden, jobben, tekniken, Norden om relevant).

## Fakta

- Siffror, namn, datum och citat ska vara exakta — hämta dem ur källmaterialet, hitta aldrig på.
- Saknas en uppgift: utelämna den. Skriv aldrig "enligt uppgift" om något du inte har källa på.
- Valutabelopp: behåll originalvalutan, lägg gärna till ungefärlig omräkning ("100 miljoner dollar, cirka en miljard kronor").
