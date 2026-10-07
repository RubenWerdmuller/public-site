# AI-opdrachten activeren

Deze AI-integratie staat in `RubenWerdmuller/public-site`, op `master` en `feature/ai-pipeline`. De werkmap van de andere agent is niet gewijzigd. De nieuwe vraagsets, wekelijkse hoofdvragen en illustraties die de andere agent inmiddels naar GitHub heeft gepusht zijn tijdens de integratie behouden.

## Wat dit doet

Een maandagbericht opent `/ai`. Beheerders geven een opdracht in een tekstveld en kiezen de volgende run of een Nederlands tijdstip. De pipeline draait iedere circa 30 minuten; GitHub kan geplande runs vertragen. Vragenopdrachten kunnen iedere week worden herhaald met actuele context. Annuleer de volgende ingeplande opdracht om een herhaling te stoppen.

Vragen worden met de OpenAI Responses API gegenereerd, lokaal én server-side gevalideerd en atomisch gepubliceerd in Neon. Verbeteringen krijgen een nieuw ID. Eerdere antwoorden, opgeslagen kaarten en bestaande dagtoewijzingen worden niet veranderd. Nieuwe vragen en vervangingen zijn alleen beschikbaar voor het betreffende duo. De pipeline stuurt bestaande vragen, expliciete gezamenlijke reisafspraken en thema-aantallen en gezamenlijke eigenschappengemiddelden van samen beantwoorde vragen mee; geen namen, e-mails, individuele antwoorden of individuele afgeleide voorkeuren. Vrije opdrachttekst wordt wel naar OpenAI gestuurd.

Appopdrachten gebruiken de Codex GitHub Action en maken een pull request op `feature/ai-task-<id>`. Tests, TypeScript, build en bestandscontroles moeten slagen. De agent kan applicatiecode en tests aanpassen, maar geen authenticatie, databaseadapter/schema, AI-pipeline, dependencies of workflows. Wijzigingen aan die infrastructuur vragen een gewone ontwikkeltaak. Appopdrachten zijn geen vrij shell-commando. De opdracht of informatie daaruit kan in publieke Codex/GitHub-logs en code terechtkomen: gebruik uitsluitend publieke instructies en bevestig dit op de opdrachtenpagina. De pipeline plaatst geen opdrachttekst in PR-beschrijvingen. Vragenopdrachten en reiscontext worden niet in de logs van het vraaggeneratiescript geschreven.

Na jouw merge naar `master` deployt Vercel. De pipeline markeert de opdracht pas als gepubliceerd wanneer de ingestelde Vercel-check op de mergecommit slaagt. Een mislukte run laat bestaande vragen/code beschikbaar en toont een foutstatus. Vastgelopen taken verlopen na twee uur; controleer een mogelijk bestaande PR voordat je opnieuw probeert. API-gebruik wordt apart van je Codex-abonnement betaald.

## 1. Nieuwste deployment controleren

Controleer in Vercel de nieuwste deployment van `master` met commitbericht `Add scheduled AI question and application pipeline`. De AI-pipeline is standaard uitgeschakeld en de opdrachtenpagina blijft besloten tot beheeradressen zijn ingesteld. Stel onderstaande secrets/variabelen in vóór je de pipeline inschakelt. Deze wijziging raakt niet de ontwikkeling die de andere agent in `Samen Op Reis` doet.

Voor de andere agent: haal de nieuwste `master` uit `public-site` op voordat je opnieuw pusht. De AI-integratie gebruikt `availableBank(pairId)` uit `lib/ai-tasks.ts` in `ensureSet` en `ensureWeeklyQuestion`, zodat nieuwe vragenbank-query's dezelfde duo-filtering behouden. Behoud `questionId`-validatie voor AI-ID's. Combineer schematabellen additief; verwijder geen bestaande tabellen of antwoord-snapshots.

## 2. Lokale setupwaarden

In deze checkout is `.env.ai-setup` aangemaakt. Open het alleen lokaal om waarden naar de instellingen te kopiëren. Dit bestand is genegeerd door Git. Er worden geen secrets in de terminal getoond.

Op een andere computer: `node scripts/ai-setup.mjs --email=jouw-contact@example.com`. Dit maakt een pipeline-secret en Web Push-sleutels, zonder een bestaand setupbestand te overschrijven. Behoud al ingestelde VAPID-sleutels om bestaande push-abonnementen te laten werken. De setup maakt geen OpenAI-key of GitHub-token; die moeten uit je eigen accounts komen.

## 3. Vercel · public-site-goai

Ga naar Settings → Environment Variables en stel in voor Production:

| Naam | Waarde |
| --- | --- |
| `DATABASE_URL` | De reeds gekoppelde Neon-URL |
| `AI_ADMIN_EMAILS` | Jullie bestaande app-loginadressen, komma-gescheiden |
| `AI_PIPELINE_SECRET` | Waarde uit `.env.ai-setup` |
| `CRON_SECRET` | Aparte setupwaarde voor dagelijkse berichtjes; behoud een reeds ingestelde waarde |
| `AI_GITHUB_REPOSITORY` | `RubenWerdmuller/public-site` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Setupwaarde, of de bestaande publieke sleutel |
| `VAPID_PRIVATE_KEY` | Bijpassende private setupwaarde, of de bestaande sleutel |
| `VAPID_SUBJECT` | `mailto:` gevolgd door je contactadres |

Node is in `package.json` vastgezet op `24.x`. Deploy de nieuwste commit van `master`; redeploy geen oude portfolio-commit. De database maakt de additieve tabellen bij de eerste verbinding aan. Voor lokale ontwikkeling blijft PGlite beschikbaar. Er is geen extra Neon-driver nodig.

## 4. GitHub-secrets en variabelen

In public-site: Settings → Secrets and variables → Actions.

Onder Secrets:

| Naam | Waarde |
| --- | --- |
| `OPENAI_API_KEY` | Eigen OpenAI Platform-key met API-billing |
| `AI_PIPELINE_SECRET` | Exact dezelfde waarde als in Vercel |
| `CRON_SECRET` | Exact dezelfde waarde als in Vercel, voor de bestaande dagelijkse scheduler |
| `AI_GITHUB_TOKEN` | Fine-grained token van de eigenaar, alleen voor public-site, Contents: read/write en Pull requests: read/write |

Het GitHub-token is voor de gecontroleerde PR-publicatiestap, niet voor de codeagent of tests. Een eigen token zorgt dat vervolgchecks en de Vercel-preview kunnen starten. Stel een vervaldatum in en vervang het token bij verlopen toegang.

Onder Variables:

| Naam | Waarde |
| --- | --- |
| `APP_URL` | `https://www.rubenwerdmuller.nl` |
| `AI_VERCEL_CONTEXT` | `Vercel – public-site-goai` (let op het lange streepje) |
| `AI_COMMIT_AUTHOR` | Je GitHub-naam en geverifieerde mail, bijvoorbeeld `Ruben Werdmuller <rubenwerdmuller@gmail.com>` |
| `AI_PIPELINE_ENABLED` | Eerst `false`, na testen `true` |
| `OPENAI_MODEL` | Optioneel; standaard `gpt-6.1-sol` |
| `CODEX_MODEL` | Optioneel; standaard `gpt-6.1-sol` |

Gebruik voor de commit-auteur het eigen account dat Vercel Hobby beheert. Dit voorkomt een deployment van een auteur die niet bij het Hobby-account hoort. Tokens en API-keys zijn secrets, geen gewone variables. De pipeline heeft geen databasewachtwoord nodig; de app doet de databasebewerkingen via de beschermde worker-route.

## 5. Eerste controle

1. Registreer/log in op de app met één van de ingestelde beheeradressen.
2. Open `/ai`. Vraag: `Maak twee nieuwe Nederlandse reisdilemma’s over reistijd versus comfort, zonder bestaande vragen te herhalen.` Kies de volgende run en laat wekelijkse herhaling uit.
3. Zet `AI_PIPELINE_ENABLED` op `true`.
4. Open GitHub → Actions → AI opdrachten → Run workflow op `master`.
5. Controleer `/ai`: de opdracht moet gepubliceerd zijn. De nieuwe vragen zitten in jullie voorraad voor toekomstige dagtoewijzingen; een bestaande dagstapel verandert niet.
6. Plan een kleine appopdracht, bijvoorbeeld `Maak de uitleg op de installatiepagina duidelijker voor iPhonegebruikers.` Start nog een workflow. Bekijk de PR en preview. Merge alleen het gewenste voorstel.
7. Na succesvolle Vercel-publicatie meldt de volgende pipeline-run de opdracht als gepubliceerd. Een afgewezen/gesloten PR wordt als niet gepubliceerd gemeld.
8. Zet in de app Instellingen → Zet berichtjes aan. Op iPhone eerst installeren via Safari → Delen → Zet op beginscherm. De maandagherinnering en resultaatmeldingen volgen tussen 09:00 en 21:00 Amsterdamtijd.

Voor wekelijkse automatische vraaggeneratie: voer een vraagopdracht in met bijvoorbeeld `Maak iedere week 14 afwisselende nieuwe vragen op basis van onze gezamenlijke context` en vink de wekelijkse herhaling aan. Dezelfde GitHub-workflow roept met `CRON_SECRET` ook de bestaande `/api/jobs`-scheduler voor dagelijkse berichtjes en reisrapporten aan. Er is geen aparte cron-job.org-taak nodig. De app bewaakt het Nederlandse tijdvenster en voorkomt herhaalde dagelijkse meldingen.

## Controles en grenzen

De lokale controles gebruiken geen echte OpenAI-aanroepen, geen hosted database en geen echte push. Ze testen JSON-contracten, DST, beheertoegang, duo-isolatie, atomische publicatie, herhaling, oude antwoord-snapshots en codebereik. De codepipeline voert na de build ook een eigen HTTP-controle uit via `scripts/ai-check.mjs`, op een aparte poort met tijdelijke testaccounts. Een echte OpenAI-run, GitHub-PR, Vercel-preview en telefoonpush moeten na het koppelen van de accounts eenmalig worden getest.

GitHub ondersteunt geplande workflows en handmatige starts: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows

Codex GitHub Action: https://learn.chatgpt.com/docs/github-action

OpenAI Structured Outputs: https://developers.openai.com/api/docs/guides/structured-outputs

API versus abonnementsgebruik: https://learn.chatgpt.com/docs/pricing
