# Oelie en Roebie — eerst vragen, dan een reis

> **Productdoel en prioriteiten:** [PRODUCT_VISION.md](PRODUCT_VISION.md) is de enige leidende bron. Dit document beschrijft de bestaande implementatie en/of technische onderzoeksdetails. Bij een tegenstrijdigheid over toekomstige UX, vraagstromen of productdoelen geldt de productvisie. De uniforme Vragen-ervaring is nog **niet** gebouwd.


De hoofdregel: **het Reiskantoor is alleen het resultaat** van antwoorden van beide reizigers. Geen invoerformulier voor etappes, weken, kosten of bestemming.

## Flow

1. **Reisvragen** (`/reisvragen`): zes kernvragen over totale duur, heenreis, terugreis, lang verblijven, tussenstops en richting. Elke persoon antwoordt apart, en een gezamenlijk antwoord telt pas als beiden hebben gekozen. Pas na vier gezamenlijk beantwoorde kernvragen wordt een eerste etappeverdeling berekend.
2. **Adaptieve keuzeproef:** daarna zestien hypothetische A/B-vergelijkingen om voorkeuren in zes kenmerken te schatten, waarbij de volgende vraag geselecteerd wordt op verwachte informatie-opbrengst. De zes etappevragen zijn nu een vaste startsequentie; alleen de latere keuzevragen zijn adaptief.
3. **Reiskantoor** (`/reiskantoor`): alleen-lezen voorstel van etappes en weekverdeling, met expliciete onzekerheid. Verschillen tussen partners staan als gespreksonderwerpen. Onderbouwde kosten, vervoersroutes, reisdagen, seizoenen, beschikbaarheid en verblijven zijn **nog niet beschikbaar**. Geen prijzen of reisduren worden verzonnen. Het volledige eindresultaat blijft daarom voorlopig.
4. **Reis-DNA** (`/reis-dna`): selecteer een van de twee reizigers en bekijk de persoonlijk geschatte Bayesiaanse MAP-logitgewichten, gerangschikt met onzekerheid (Laplace-benadering). Bij weinig gegevens geen ranking, maar een eerlijke melding. Geen wetenschappelijk gevalideerde DCE of relatie-indicator.

## Bestaande UI

- **Op de bank** heette het scherm met **bewaarde, later te beantwoorden vragen**. De nieuwe naam is **Voor later**. Beantwoorde vragen blijven via Geschiedenis beschikbaar.
- **Reisrapport** was een wekelijks fantasierapport voorafgaand aan een reis, geen reislogboek. Het wordt niet meer getoond in de hoofdinterface. Oud database-materiaal blijft staan; dit is geen destructieve migratie.
- De oorspronkelijke dagelijkse vragen, profielen, opgeslagen voorkeuren en weekhoofdvraag zijn ongewijzigd. Er is nu een tweede, expliciete vragenstroom voor etappes en adaptieve keuzes.

## Veiligheid en bewijs

- `/api/reiskantoor` vereist een ingelogd account en duo-scope (`pair_id`).
- Er is alleen een `answer`-actie; het oude `save-plan`-formulier is afgesloten. Bestaande oude tripplanrijen worden niet overschreven.
- Antwoorden worden eenmalig opgeslagen, met database-lock tegen dubbele rondes. Individuele keuzes worden alleen in gezamenlijke conclusies gebruikt als beide personen dezelfde vergelijking hebben voltooid. Persoonlijke ranking van de ander wordt uitsluitend uit gezamenlijk afgeronde vergelijkingen opgebouwd.
- Het model heeft weinig observaties en is nadrukkelijk **verkennend**. De labels en foutmarges zijn geen gevalideerde persoonlijkheidskenmerken of kans op reisgeluk.

## Nodig voor een volledig echt resultaat

Voeg een dataset/connector met aantoonbaar actuele wegafstanden, reisduur per traject, locatie-attributen, seizoenen, kosten, accommodaties en beschikbaarheid toe. Modelleer dan de hele route met expliciete geografische relaties en harde beperkingen, en laat iedere aanbeveling terugverwijzen naar zowel de bron als de relevante voorkeuren. **Niets boekbaar of prijs-geverifieerd claimen zolang dit niet aanwezig is.**

## Controleren

```sh
npm install --no-save --package-lock=false
npm run typecheck
npm run lint
npx tsx --test tests/reiskantoor.test.ts
npm run build
```

Er staat een GitHub Actions check in `.github/workflows/reiskantoor-check.yml`. Test met twee echte accounts vooral het onthullen na dubbel antwoord, navigatie op iPhone en het voorkomen van fantasie-etappes voordat de vier kernvragen samen zijn beantwoord.
