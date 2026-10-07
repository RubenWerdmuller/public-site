# Samen op reis

Een klein dagelijks reisspelletje voor twee. Mobile-first, met een ruime laptopweergave, een Nederlandse vraagbank met 124 dilemma’s (64 nieuwe voor de langere autoreis) en een rustige getekende notitieboekstijl.

## Lokaal starten

Node 22+ en npm. Geen Docker, database-installatie of account nodig.

```sh
npm install
node scripts/icons.mjs
npm run dev
```

Laptop: http://localhost:3100. Telefoon op dezelfde wifi: http://192.168.2.12:3100 (vervang het IP als dit verandert). De server luistert op 0.0.0.0. Windows Firewall moet toegang op het privénetwerk toestaan. PWA-installatie en Web Push vereisen HTTPS; de LAN-link dient voor bekijken en spelen. Localhost geldt op de laptop als veilige context.

Open de startpagina voor de gevraagde voorbeeldvraag. Maak twee accounts in afzonderlijke browsers of één normaal en één privévenster. Account 1 deelt de uitnodiging. Account 2 maakt een account en plakt de code in ‘Reispartner koppelen’, vóór het eerste antwoord. Beantwoord dezelfde vraag met beide accounts: pas daarna is de keuze van de partner zichtbaar. De app haalt iedere 20 seconden nieuwe gegevens op.

## Samen proefreizen — zonder opslag

Open http://localhost:3100/test (telefoon: http://192.168.2.12:3100/test). Je begint direct bij een vraag, zonder account. Klik op **Oelie** of **Roebie** om dezelfde vraag als de ander te beantwoorden. De testmodus hergebruikt de echte vraag-, reveal-, bank-, inzicht- en rapportschermen en dezelfde domeinregels. Het is één gedeelde testronde binnen één tab; twee apparaten hebben ieder hun eigen lege test.

De dagelijkse vraag begint direct bovenaan met A/B en een klein vraagnummer. De testbediening staat onder de keuzes. Op de homepage staan de reisgenoten alleen linksonder in de laptopnavigatie.

Onder **Testopties**:

- **Test berichtje** simuleert de dagelijkse notificatie. Een klik opent meteen een nog onbeantwoorde vraag.
- **Volgende week** laat een nieuwe hoofdvraag zien, met eigen antwoorden per week en terugkerende vragen.
- **Voorbeeldweek** voegt expliciet fictieve antwoorden toe voor een gevuld reisrapport.
- **Pet af / Pet op** wisselt Roebies portret overal tegelijk.
- **Bespreken** geeft bespreekvragen en een tijdelijk kladblok.
- **Opnieuw** wist keuzes, voorbeeldantwoorden, feedback en krabbels voor een nieuwe ronde.

Er worden geen API-aanvragen voor appdata gedaan, geen notificatiepermissies gevraagd en geen antwoorden, feedback of krabbels naar database, localStorage of sessionStorage geschreven. Ook met een bestaande login blijft deze route geïsoleerd. Vernieuwen maakt de testronde leeg; de URL kan hetzelfde scherm blijven tonen. Kopieer krabbels zelf als je ze wilt bewaren of bespreken.

`lib/characters.ts` is de enige portretregistratie voor de avatarpicker, database-avatarseed, testpersonen en SVG-renderer. Oelie is blond; Roebie heeft een kale en een petvariant. `Travelers` toont dezelfde reisgenoten op home, bij vragen en reveals, in inzichten en in het rapport. De echte app blijft de gekozen gebruikersavatars gebruiken.

Voor ingelogde gebruikers opent de app standaard bij de eerste resterende dagvraag. Pushlinks openen rechtstreeks hun betreffende vraag. Na een antwoord of bewaren volgt direct de volgende vraag. Na vier vragen kun je Nog een set kiezen. Alle sets blijven bereikbaar; persoonlijke totalen tellen alleen volledig beantwoorde sets. Reveals zijn via de geschiedenis en het setarchief te bekijken. Een login vanuit een vraaglink keert terug naar die vraag.

Windows: `powershell -ExecutionPolicy Bypass -File scripts/start-local.ps1` start de app op de achtergrond en opent je browser. Opnieuw uitvoeren opent de bestaande app. Logs staan lokaal in `data/`.

## Opslag en architectuur

Next.js + React + TypeScript. Eén PostgreSQL-schema in `lib/schema.ts`. Lokaal draait echte PostgreSQL via PGlite in `data/postgres`; antwoorden blijven bewaard na herstart. Online wordt via `DATABASE_URL` normale beheerde PostgreSQL gebruikt. De lokale map wordt nooit gepubliceerd. Hosting is dus geen synchronisatie van je lokale proefdata; exporteer/importeer die desgewenst apart.

Kleine SQL-adapter met parameterized queries in plaats van een ORM. Users, avatars, hashed sessions, travel pairs, membership slots, invites, questions/options, attributes/values, option attributes, immutable answer snapshots, saved questions, assignments, preference estimates, compatibility insights, reports, feedback, push subscriptions en delivery records zijn aanwezig. Duo-capaciteit wordt met een unieke slotconstraint afgedwongen. Registratie en koppelen gebruiken atomische SQL-statements. Alle duo-data wordt server-side gefilterd; andere accounts hebben geen lees- of schrijfroute naar je duo.

Wachtwoorden: salted scrypt. Sessies: willekeurige tokens, alleen hashes opgeslagen, HttpOnly/SameSite cookies, 30 dagen geldig. Loginpogingen worden beperkt. Mutaties vereisen een passende Origin. Uitnodigingen zijn eenmalig, verlopen na 7 dagen. Een duo verlaten/wisselen na antwoorden is bewust geen MVP-functie.

`selectTravelSet` is de vervangbare domeingrens: vermijdt herhaling, wisselt vraagtypes af en geeft minder onderzochte thema’s voorrang. De 124 vragen zijn geen AI-generatie. Nieuwe sets gebruiken de 64 autoreisvragen met expliciete context, grensvragen en eigen dromen. Schattingen zijn eenvoudige directional evidence; geen causaliteit of gevalideerd adaptive conjoint model. Interactieanalyse en feedbackgestuurde selectie zijn uitbreidingen. Rapporten gebruiken uitsluitend samen beantwoorde vragen, zijn vaste wekelijkse momentopnames, en tonen voorlopige tekst bij weinig gegevens. Rapportfeedback wordt opgeslagen voor een later model.

Rough.js button rendering volgt het SketchUI-componentpatroon: https://sketchui.sanjoydev.com/docs/components/button. De 12 getekende avatars en 106 vraagillustraties zijn lokaal. Het schetsboek staat op /schetsboek; eerdere foto’s en credits zijn gearchiveerd op /fotocredits. Fonts hebben lokale browserfallbacks. Offline wordt een privédata-vrije app-shell getoond; antwoorden worden alleen online verzonden en nooit stilletjes offline queued.

## Cheap & easy online

Aanbevolen: **Vercel Hobby + Neon Free** voor deze persoonlijke app. Geen databaseserver beheren. Maak één Neon-project, kopieer de pooled PostgreSQL connection string naar `DATABASE_URL`, importeer deze repo in Vercel en stel de variabelen in. De app maakt het schema en de vraagbank bij de eerste databaseverbinding idempotent aan. Voor groei verplaats je dit naar expliciete deployment migrations.

- Vercel Hobby: https://vercel.com/docs/plans/hobby (persoonlijk/niet-commercieel gebruik).
- Neon Free: https://neon.com/docs/introduction/plans (gratis binnen de actuele limieten; scale-to-zero kan een eerste aanvraag vertragen).
- Supabase is een goed alternatief als je later managed auth wilt. Free-projecten kunnen pauzeren na inactiviteit: https://supabase.com/docs/guides/platform/free-project-pausing.

Er is eenmalige account/configuratie nodig. ‘Geen databaseonderhoud’ is haalbaar; letterlijk nul setup niet. De app wordt inmiddels vanuit `RubenWerdmuller/public-site` op Vercel gepubliceerd en is bereikbaar op https://rubenwerdmuller.nl. Pushconfiguratie moet nog worden geactiveerd; de dagelijkse scheduler wordt mee gedeployd vanuit vercel.json.

## Environment

Kopieer `.env.example` naar `.env.local`. Commit nooit lokale keys.

| Variabele | Gebruik |
| --- | --- |
| DATABASE_URL | Leeg lokaal; pooled PostgreSQL URL online, met SSL zoals de provider voorschrijft |
| APP_URL | Canonieke online HTTPS URL |
| CRON_SECRET | Lang willekeurig geheim voor de scheduler |
| NEXT_PUBLIC_VAPID_PUBLIC_KEY | Publieke Web Push sleutel; wordt vanuit de server opgehaald |
| VAPID_PRIVATE_KEY | Private Web Push sleutel, alleen server |
| VAPID_SUBJECT | Geldige https: of mailto: contact-URL |

VAPID genereren: `npx web-push generate-vapid-keys`. Neem de publieke/private uitvoer alleen over in je lokale en hosted environment, niet in Git.

## Push en scheduling

Na installatie: Instellingen → Zet berichtjes aan. Geen permissievraag bij eerste bezoek. iOS: Safari → Delen → Zet op beginscherm, daarna vanuit het app-icoon notificaties activeren. Werkt vanaf iOS 16.4+ en ondersteunde browsers.

De standaard Vercel-taak roept `/api/jobs` dagelijks in de avond aan. Voor gevarieerde eerdere tijden en extra herpogingen kun je optioneel iedere 15 minuten server-side aanroepen met `Authorization: Bearer <CRON_SECRET>`, bijvoorbeeld via cron-job.org. Jobs zijn onafhankelijk van de browser. Ze maken dagelijkse opdrachten en weekrapporten en sturen maximaal één gepland bericht per gebruiker per dag. Het tijdstip varieert deterministisch van 09:00 tot 19:00 Amsterdamtijd; vertraagde runs mogen tot vóór 21:00 leveren. Maandag krijgt het weekrapport prioriteit. Zomer-/wintertijd is meegenomen. Tijdelijke pushfouten worden opnieuw geprobeerd, verlopen subscriptions verwijderd. Notification clicks deep-linken naar de vraag of het rapport.

Lokaal jobs uitvoeren: zet de variabelen in je shell en `npm run jobs` terwijl de devserver gestopt is (PGlite heeft één proces als eigenaar). In de draaiende app test je liever de beschermde HTTP-route. De CLI laadt `.env.local` niet automatisch.

Het MVP bevat nog geen onmiddellijke ‘je partner heeft gekozen’-push; het antwoord verschijnt via polling. Gebruik voor handmatige push QA een echt geïnstalleerde HTTPS-app, geef permissie en kies bij Instellingen Stuur mij een testberichtje.

## Controle

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Domeintests dekken answer privacy, matching, selectie, Amsterdamtijd/DST, rapportbeperkingen en seedkwaliteit. `scripts/verify.mjs` test de volledige serverflow met gescheiden cookiejars, koppelen, antwoorden, reveals, IDOR, bewaren en feedback tegen de draaiende server. `scripts/browser-check.mjs` maakt desktop/mobile screenshots en controleert onboarding en een keuze in Chromium.

`node scripts/preview-check.mjs` controleert de testflow met geblokkeerde API-routes, een aanwezige inlogcookie, twee testpersonen, reveal, bank, petvariant, notificatie-instap, voorbeeldrapport, krabbels, reset en mobiele weergave. De test controleert dat geen app-API wordt aangeroepen, geen browseropslag wordt geschreven en geen service worker vanuit de testmodus wordt geregistreerd.

## Bewuste grenzen

Dit is een bruikbaar MVP: geen echte boekingsvoorstellen, uitgebreide statistische interactiemodellen, password-resetmail of een live geconfigureerde cloud/pushdienst. Bewaar belangrijke hosted data ook met een periodieke export; de gratis hostingplannen zijn geen vervanging voor je eigen backupkeuze.

## Reisprofiel en sets

Instellingen → Onze reisuitgangspunten bevat de gedeelde en persoonlijke startcontext, open vragen, voorkeursterkte en numerieke grenzen. Nieuwe sets lezen deze data uit PostgreSQL. Het archief houdt ook onafgemaakte eerdere sets bereikbaar. Details: [voorkeurmodel](docs/PREFERENCE_MODEL.md), [vraagstrategie](docs/QUESTION_STRATEGY.md), [bekende context](docs/KNOWN_TRAVEL_CONTEXT.md).

Controleer de echte opslagflow met `node scripts/sets-check.mjs` en de geïsoleerde testflow met `node scripts/preview-check.mjs`. Fotobronnen staan in `public/photos/credits.json`; opnieuw downloaden kan met `node scripts/download-photos.mjs`.

## Soort, categorie en hoofdvraag

Bij het beantwoorden en vergelijken staat onder de titel zowel de soort vraag (bijvoorbeeld Grens verkennen, Voorkeur, Open vraag of Persoonlijke wens) als het onderwerp. Dit beschrijft wat je onderzoekt; een A/B-antwoord legt niet automatisch een harde grens vast.

Vandaag en het rapport tonen de hoofdvraag van deze week. Beide personen krijgen dezelfde vraag; antwoorden blijven geheim tot beiden die week hebben gekozen. De hoofdvraag telt apart van de dagelijkse sets. Elke Amsterdamse kalenderweek vanaf maandag heeft een eigen opdracht en onveranderbare antwoorden. Hoofdvragen mogen terugkomen, met de laatste twee opdrachten als rustpauze; eerdere antwoorden blijven apart bewaard en zichtbaar bij de hoofdvraag. De gewone dagelijkse inzichten en rapportberekeningen gebruiken hun bestaande setantwoorden.

Proberen zonder opslag: http://localhost:3100/test?screen=weekly-question. Onder Testopties laat Volgende week zien hoe een volgende ronde en herhaling werken. `node scripts/weekly-check.mjs` controleert de opgeslagen hoofdvraag, geheimhouding, scheiding van sets en de browserflow.

## Schetsboek

Bij vragen staan 106 lokale SVG-schetsen in de notitieboekstijl: 56 eigen tekeningen en 50 gedownloade doodles. De eigen tekeningen bestrijken veertien onderwerpen, waaronder zeilen, tuinieren, keramiek, koken, wandelen, kamperen en grappige dieren. De keuze hangt stabiel af van het onderwerp, vraagnummer en de antwoordoptie; beide personen krijgen dezelfde tekeningen. Rough.js maakt vaste potloodstreken zonder netwerkverzoeken. Alle illustraties staan op `/schetsboek`, ook bereikbaar via Instellingen. De eerder gedownloade foto's en hun bronvermelding blijven als archief beschikbaar op `/fotocredits`.

Het schetsboek bevat daarnaast 50 gedownloade Doodle Icons van Khushmeen Sidhu (CC0-1.0): samen 106 tekeningen. De originele handgetekende vormen blijven behouden; de inkt en lokale omlijsting gebruiken het notitieboekpalet en een licht SVG-filter maakt de lijnen fijner. Selectie, bron-URL per bestand en gepinde bronversie staan in `lib/imported-sketches.json`; alle SVG-bestanden en licenties staan in `public/sketches`. Opnieuw downloaden: `node scripts/import-doodles.mjs`. Zowel vragen als het schetsboek gebruiken dezelfde registratie en thema-selectie.

## Installatieknop en pushstatus

Elk appscherm biedt onderaan Zet de app op je beginscherm. Ondersteunende browsers openen het native installatievenster; zonder dat venster volgen apparaatinstructies. Op iPhone leidt de knop naar de stappen in het deelmenu. Een gebruikte prompt wordt gewist; afwijzen is geen installatie. Standalone-modus en het appinstalled-event tonen de geïnstalleerde staat. Testmodus roept nooit het installatievenster aan. Installeren zet notificaties niet automatisch aan.

De instellingen tonen nu of de server publiek/private VAPID en CRON_SECRET heeft. Zonder alle drie blijft de opt-in uitgeschakeld. Deze gereedheidscheck bewijst geen geslaagde levering; de dagelijkse taak in vercel.json moet op Vercel gedeployd zijn. Op iPhone vraagt de app alleen vanuit de geïnstalleerde webapp om push.

`node scripts/install-check.mjs` test native installatie, afwijzen en opnieuw proberen, geïnstalleerde staat, iPhone-uitleg en isolatie van testmodus. Gebruik `APP_TEST_URL` voor een andere tijdelijke testserver.

## Push activeren zonder losse handmatige sleutelstappen

`npm run push:prepare` maakt een passend VAPID-sleutelpaar en een sterk scheduler-geheim, of behoudt bestaande bruikbare sleutels. De waarden staan uitsluitend in de genegeerde map `data/push-setup`; ze worden niet gelogd of gepubliceerd.

Eenmalig: `npx --yes vercel@62.7.0 login`. Daarna: `npm run push:activate`. Het script controleert het bestaande project `public-site-goai`, de scope `rubenwerdmullers-projects` en de aanwezige productie-database. Het uploadt alleen ontbrekende variabelen via stdin, bewaart private sleutels en CRON_SECRET als sensitive, overschrijft geen bestaande hostingwaarden en publiceert opnieuw. Bij een ander project gebruik je PUSH_VERCEL_PROJECT/PUSH_VERCEL_SCOPE. Als de database nog ontbreekt, stopt het script voordat pushwaarden worden toegevoegd.

`vercel.json` roept de beschermde `/api/jobs` eenmaal per dag aan om 18:00 UTC. Dat valt op het gratis plan binnen ongeveer 19:00-20:00 Nederlandse wintertijd en 20:00-21:00 zomertijd, na alle persoonlijke doeluren en binnen het bestaande venster. Vercel levert de Authorization-header vanuit CRON_SECRET. Het precieze tijdstip is geen garantie; gemiste of sterk vertraagde runs worden niet de volgende ochtend ingehaald. Bestaande frequentere externe jobs mogen daarnaast blijven draaien; de dagclaim voorkomt dubbele geplande berichten. Voor een betrouwbaardere herpoging of gevarieerde eerdere tijden kun je later iedere 15 minuten een externe scheduler gebruiken.

De app haalt de publieke sleutel bij de server op; de private sleutel blijft server-side. De gereedheidscheck valideert het sleutelpaar, de subject-URL en het scheduler-geheim. Na installatie en aanmelden: Instellingen, Zet berichtjes aan, Stuur mij een testberichtje. De server verstuurt dat testbericht alleen naar een subscription die bij jouw account en dit toestel hoort. Het testbericht vervangt geen dagelijkse dagclaim.
