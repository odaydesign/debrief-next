import { internalMutation } from "./_generated/server";

export default internalMutation({
    handler: async (ctx) => {
        // Clear existing data
        const existingArticles = await ctx.db.query("articles").collect();
        for (const a of existingArticles) await ctx.db.delete(a._id);
        const existingInteractions = await ctx.db.query("userInteractions").collect();
        for (const i of existingInteractions) await ctx.db.delete(i._id);
        const existingNotes = await ctx.db.query("notes").collect();
        for (const n of existingNotes) await ctx.db.delete(n._id);

        const now = new Date();
        const getDate = (daysOffset: number) => {
            const d = new Date(now);
            d.setDate(d.getDate() + daysOffset);
            return d.toISOString();
        };

        // ── 25 diverse article templates ──────────────────────────────────────
        const articles = [
            // AI
            {
                title: "Claude 4 Sonnet Slår Alla Benchmarks — Vad Det Betyder för Utvecklare",
                summary: "Anthropics senaste modell visar en 40% förbättring i kodningsuppgifter och introducerar extended thinking på under en sekund.",
                tag: "AI", type: "news",
                image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2000&auto=format&fit=crop",
                bgColor: "bg-[#1a1818]", textColor: "text-white",
                tagStyle: "bg-blue-500 text-white", buttonText: "LÄS MER",
                content: "<p>Anthropic released Claude 4 Sonnet today with significant improvements across the board. The model demonstrates unprecedented performance in multi-step reasoning tasks while maintaining low latency.</p>"
            },
            {
                title: "AI-Agenter tar över Utvecklarflöden: En Praktisk Genomgång",
                summary: "Från kodgranskning till deployment — hur AI-agenter omdefinierar vad det innebär att vara senior utvecklare 2026.",
                tag: "AI", type: "news",
                image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=2000&auto=format&fit=crop",
                bgColor: "bg-[#2a2726]", textColor: "text-white",
                tagStyle: "bg-blue-500 text-white", buttonText: "LÄS ANALYS",
                content: "<p>The shift from AI as a tool to AI as a collaborator is happening faster than anyone predicted. Here's how teams are actually using it day to day.</p>"
            },
            {
                title: "Google DeepMind Presenterar Gemini Ultra 3 med Nativ Multimodal Reasoning",
                summary: "Nya arkitekturförändringar gör det möjligt att bearbeta video, kod och text simultant med en enda inferens.",
                tag: "AI", type: "news",
                image: "https://images.unsplash.com/photo-1655720828018-edd2daec9349?q=80&w=2000&auto=format&fit=crop",
                bgColor: "bg-[#1a1818]", textColor: "text-white",
                tagStyle: "bg-blue-500 text-white", buttonText: "LÄS MER",
                content: "<p>DeepMind's latest flagship model represents a fundamental shift in how multimodal AI systems process information across modalities simultaneously.</p>"
            },
            {
                title: "De dolda kostnaderna med att köra LLMs i produktion överstiger $2M per år för medelstora företag.",
                type: "twitter", tag: "AI",
                tagStyle: "bg-blue-500 text-white", buttonText: "LÄS TRÅD",
                bgColor: "bg-[#15202b]", textColor: "text-white",
                externalId: "1765432109876543210"
            },
            {
                title: "Open Source vs Stängd AI: Skiljelinjen 2026",
                summary: "Medan Meta och Mistral accelererar öppna modeller, stärker OpenAI och Anthropic sina proprietära ekosystem. Vem vinner?",
                tag: "AI", type: "news",
                image: "https://images.unsplash.com/photo-1676299081847-824916de030a?q=80&w=2000&auto=format&fit=crop",
                bgColor: "bg-[#1e3a5f]", textColor: "text-white",
                tagStyle: "bg-blue-500 text-white", buttonText: "LÄS ANALYS",
                content: "<p>The battle between open and closed AI is not just philosophical—it has real consequences for who controls the future of software development.</p>"
            },

            // DESIGN
            {
                title: "Brutalistisk Webbdesign Gör Comeback — Men Med en Modern Twist",
                summary: "En ny generation designers återupptäcker råheten i 90-talets estetik och parar det med nutida typografi och rörliga element.",
                tag: "DESIGN", type: "news",
                image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2000&auto=format&fit=crop",
                bgColor: "bg-[#f6f4f1]", textColor: "text-[#2a2726]",
                tagStyle: "bg-[#f4a261] text-[#1a1818]", buttonText: "SE EXEMPEL",
                content: "<p>Brutalism in web design is having a renaissance. Designers are embracing asymmetry, visible structure, and bold typography as a reaction to the homogenized, rounded aesthetic that has dominated the past decade.</p>"
            },
            {
                title: "Apples Uppdaterade Human Interface Guidelines Förändrar hur vi Tänker på Hierarki",
                summary: "Ny dokumentation introducerar 'depth layers' och en reviderad syn på typografisk skala för multi-device interfaces.",
                tag: "DESIGN", type: "news",
                image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?q=80&w=2000&auto=format&fit=crop",
                bgColor: "bg-[#f6f4f1]", textColor: "text-[#2a2726]",
                tagStyle: "bg-[#f4a261] text-[#1a1818]", buttonText: "LÄSA GUIDELINES",
                content: "<p>Apple's new HIG documentation represents the most significant design system update in five years, introducing new spatial computing patterns.</p>"
            },
            {
                title: "Figma Introduces AI Layout Generation — Is the Wireframing Phase Dead?",
                summary: "The new AI-powered layout engine can generate adaptive component structures from a single natural language prompt.",
                tag: "DESIGN", type: "youtube",
                image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=2000&auto=format&fit=crop",
                bgColor: "bg-[#e85d4e]", textColor: "text-white",
                tagStyle: "bg-[#f4a261] text-[#1a1818]", buttonText: "TITTA NU",
                externalId: "dQw4w9WgXcQ"
            },
            {
                title: "Hantverk vs Hastighet: Designers Nya Dilemma i AI-Eran",
                summary: "När verktyg genererar på sekunder, vad är då värdet av genomarbetat designtänkande? En djupdykning i professionens identitetskris.",
                tag: "DESIGN", type: "news",
                image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=2000&auto=format&fit=crop",
                bgColor: "bg-[#f6f4f1]", textColor: "text-[#2a2726]",
                tagStyle: "bg-[#f4a261] text-[#1a1818]", buttonText: "LÄS ESSAY",
                content: "<p>The rise of generative design tools has fundamentally altered the creative process. We spoke to 20 senior designers about how they're navigating this shift.</p>"
            },
            {
                title: "Designen som skapar rum, inte som fyller det — en filosofi om tomrum och intention.",
                type: "twitter", tag: "DESIGN",
                tagStyle: "bg-[#f4a261] text-[#1a1818]", buttonText: "LÄS TRÅD",
                bgColor: "bg-[#f6f4f1]", textColor: "text-[#2a2726]",
                externalId: "1765432109876543211"
            },

            // DEV
            {
                title: "Bun 2.0 Lanseras med Inbyggd TypeScript HMR och 3x Snabbare Cold Starts",
                summary: "Det alternativa JavaScript-runtimet tar sin mest ambitiösa uppdatering — och nu är det svårt att ignorera.",
                tag: "DEV", type: "news",
                image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2000&auto=format&fit=crop",
                bgColor: "bg-[#2a2726]", textColor: "text-white",
                tagStyle: "bg-[#50c878] text-[#1a1818]", buttonText: "LÄS RELEASE NOTES",
                content: "<p>Bun 2.0 ships with native TypeScript compilation, a built-in test runner, and SQLite support. The benchmark numbers are genuinely shocking.</p>"
            },
            {
                title: "CSS Grid Level 3 Ändrar Allt vi Visste om Layout",
                summary: "Subgrid, masonry och avancerade gap-funktioner landar äntligen i alla stora webbläsare — här är vad du behöver veta.",
                tag: "DEV", type: "news",
                image: "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?q=80&w=2000&auto=format&fit=crop",
                bgColor: "bg-[#f6f4f1]", textColor: "text-[#2a2726]",
                tagStyle: "bg-[#50c878] text-[#1a1818]", buttonText: "LÄS ARTIKEL",
                content: "<p>The full CSS Grid Level 3 specification is now supported across Chrome, Firefox, and Safari. Here's a comprehensive guide to the new capabilities.</p>"
            },
            {
                title: "Next.js 16 Masterclass: Server Components, Partial Prerendering & Edge Caching",
                summary: "En intensiv genomgång av de viktigaste arkitekturförändringarna i Next.js 16 och hur de påverkar verkliga applikationer.",
                tag: "DEV", type: "youtube",
                image: "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?q=80&w=2000&auto=format&fit=crop",
                bgColor: "bg-[#2a2726]", textColor: "text-white",
                tagStyle: "bg-[#50c878] text-[#1a1818]", buttonText: "TITTA PÅ PREMIÄR",
                externalId: "jNQXAC9IVRw"
            },
            {
                title: "Senior-devs migrerar tillbaka till SSR. Vi har gått full cirkel och det är faktiskt bra.",
                type: "twitter", tag: "DEV",
                tagStyle: "bg-[#50c878] text-[#1a1818]", buttonText: "LÄS TRÅD",
                bgColor: "bg-[#15202b]", textColor: "text-white",
                externalId: "1765432109876543212"
            },
            {
                title: "Varför TypeScript 6.0 Gör JavaScript Faktiskt Roligt Igen",
                summary: "Nya typsystemförbättringar, bättre inference och snabbare kompilering — TypeScript 6 representerar en mogen plattform.",
                tag: "DEV", type: "news",
                image: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=2000&auto=format&fit=crop",
                bgColor: "bg-[#2a2726]", textColor: "text-white",
                tagStyle: "bg-[#50c878] text-[#1a1818]", buttonText: "LÄS MER",
                content: "<p>TypeScript 6.0 brings significant improvements to the type system including better conditional type inference and faster incremental compilation.</p>"
            },

            // TECH
            {
                title: "Apple Silicon M5 Pro: Läckta Benchmarks Visar 60% Prestandaökning",
                summary: "Leverantörskedjekällor bekräftar nästa generations chip med förbättrad Neural Engine och dubbelt minnesbandbredd.",
                tag: "TECH", type: "news",
                image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?q=80&w=2000&auto=format&fit=crop",
                bgColor: "bg-[#1a1818]", textColor: "text-white",
                tagStyle: "bg-[#50c878] text-[#1a1818]", buttonText: "LÄS OM RYKTENA",
                content: "<p>Supply chain sources are pointing to a Q4 release for Apple's M5 Pro chip, with benchmark leaks showing substantial improvements over M4.</p>"
            },
            {
                title: "Apple Vision Pro 2 Ryktade Funktioner: Lättare, Starkare, Längre Batteritid",
                summary: "Ny läckage pekar på ett redesignat headset som väger 200g mindre med en förbättrad spatial audio-upplevelse.",
                tag: "TECH", type: "news",
                image: "https://images.unsplash.com/photo-1707157280629-2ef4fd431b0a?q=80&w=2000&auto=format&fit=crop",
                bgColor: "bg-[#1a1818]", textColor: "text-white",
                tagStyle: "bg-[#50c878] text-[#1a1818]", buttonText: "LÄS OM RYKTENA",
                content: "<p>Apple Vision Pro 2 is reportedly entering mass production testing. Key improvements address the weight and comfort issues that limited adoption of the first generation.</p>"
            },
            {
                title: "Nvidias H300 GPU-Arkitektur Avslöjad — AI-Träning Kostar Nu 10x Mindre",
                summary: "Nästa generations datacenter-GPU lovar dramatiskt förbättrad effektivitet, vilket demokratiserar träning av stora modeller.",
                tag: "TECH", type: "news",
                image: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?q=80&w=2000&auto=format&fit=crop",
                bgColor: "bg-[#1a1818]", textColor: "text-white",
                tagStyle: "bg-[#50c878] text-[#1a1818]", buttonText: "LÄS ANALYS",
                content: "<p>Nvidia's H300 architecture represents a generational leap in AI training efficiency, potentially unlocking model training for organizations that previously couldn't afford it.</p>"
            },

            // STARTUP
            {
                title: "YC W26 Kohorten: De AI-Nativa Bolagen att Bevaka",
                summary: "Av 400 antagna bolag bygger 87% sin kärnprodukt direkt på LLMs — en historisk förändring i startup-ekosystemet.",
                tag: "STARTUP", type: "news",
                image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?q=80&w=2000&auto=format&fit=crop",
                bgColor: "bg-[#f6f4f1]", textColor: "text-[#2a2726]",
                tagStyle: "bg-[#e85d4e] text-white", buttonText: "SE HELA LISTAN",
                content: "<p>Y Combinator's Winter 2026 cohort is the most AI-dense in the accelerator's history. We analyzed every company to find the most promising bets.</p>"
            },
            {
                title: "Hur Klarna Byggde om Hela sin Stack med AI och Minskade Kostnaderna med 40%",
                summary: "En sällan sedd inblick i hur en av Europas mest kända fintech-bolag genomförde en total teknologisk transformation på 18 månader.",
                tag: "STARTUP", type: "news",
                image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=2000&auto=format&fit=crop",
                bgColor: "bg-[#f6f4f1]", textColor: "text-[#2a2726]",
                tagStyle: "bg-[#e85d4e] text-white", buttonText: "LÄS FALLSTUDIE",
                content: "<p>Klarna's AI transformation isn't just about chatbots. It's a complete reimagining of how financial services can operate at scale.</p>"
            },

            // EVENT
            {
                title: "WWDC 2026: Allt vi Förväntar oss — Vision OS 3, iOS 20 och mer",
                summary: "Apples utvecklarkonferens är bara veckor bort. Här är de ryktade tillkännagivandena som kan förändra plattformsutveckling.",
                tag: "EVENT", type: "news",
                image: "https://images.unsplash.com/photo-1505245208761-ba3ce09c1500?q=80&w=2000&auto=format&fit=crop",
                bgColor: "bg-[#e85d4e]", textColor: "text-white",
                tagStyle: "bg-[#f6f4f1] text-[#2a2726]", buttonText: "VISA SCHEMA",
                content: "<p>WWDC 2026 promises to be one of the most significant developer conferences in Apple's history, with major updates expected across all platforms.</p>"
            },
            {
                title: "Stockholm Design Week 2026: Utställningar, Föreläsare och Vad man Inte Bör Missa",
                summary: "Mer än 200 studios ställer ut, med fokus på AI-assisterad tillverkning och hållbara materialinnovationer.",
                tag: "EVENT", type: "news",
                image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2000&auto=format&fit=crop",
                bgColor: "bg-[#e85d4e]", textColor: "text-white",
                tagStyle: "bg-[#f6f4f1] text-[#2a2726]", buttonText: "BOKA BILJETT",
                content: "<p>Stockholm Design Week returns with its largest program ever. This year's theme centers on the intersection of technology and material culture.</p>"
            },

            // INSPIRATION
            {
                title: "Designern som Raderade Sociala Medier och Vann",
                summary: "En djupdykning i hur en välkänd produktdesigner bytte ut LinkedIn och Twitter mot ett privat nyhetsbrev — och tredubblade sin inkomst.",
                tag: "INSPIRATION", type: "news",
                image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2000&auto=format&fit=crop",
                bgColor: "bg-[#b8a30e]", textColor: "text-[#1a1818]",
                tagStyle: "bg-[#b8a30e] text-[#1a1818]", buttonText: "LÄS BERÄTTELSEN",
                content: "<p>Two years ago, Mia Chen deleted all her social media accounts. What happened next surprised even her.</p>"
            },
            {
                title: "Minimalism handlar inte om att ha mindre — det handlar om att skapa utrymme för det som verkligen betyder något.",
                type: "quote", tag: "INSPIRATION",
                tagStyle: "bg-[#b8a30e] text-[#1a1818]",
                bgColor: "bg-[#b8a30e]", textColor: "text-[#1a1818]",
                content: "<p>A guiding principle for anyone navigating information overload in 2026.</p>"
            },
            {
                title: "Varje Dag Skriver Jag 500 Ord om Ingenting. Det Förändrade Hur Jag Tänker.",
                summary: "En engineer på Spotify delar hur ett obetydligt dagligt ritualupprepning på 18 månader ledde till hennes bästa karriärbeslutet.",
                tag: "INSPIRATION", type: "news",
                image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=2000&auto=format&fit=crop",
                bgColor: "bg-[#f6f4f1]", textColor: "text-[#2a2726]",
                tagStyle: "bg-[#b8a30e] text-[#1a1818]", buttonText: "LÄS ESSÄ",
                content: "<p>Consistency, not inspiration, is what builds creative capacity. Here's the evidence.</p>"
            },
        ];

        // ── Days to seed: -4 to +3 (today = 0) ──────────────────────────────
        const days = [-4, -3, -2, -1, 0, 1, 2, 3];

        // Articles per day (varies slightly)
        const articlesPerDay = [7, 8, 9, 8, 10, 6, 6, 5];

        let totalInserted = 0;

        for (let d = 0; d < days.length; d++) {
            const dayOffset = days[d];
            const dateStr = getDate(dayOffset);
            const count = articlesPerDay[d];

            for (let i = 0; i < count; i++) {
                const idx = (d * 7 + i * 3) % articles.length;
                const base = articles[idx];

                await ctx.db.insert("articles", {
                    ...base,
                    date: dateStr,
                    title: base.title,
                });
                totalInserted++;
            }
        }

        return `Seeded ${totalInserted} articles across ${days.length} days (-4 to +3)`;
    },
});
