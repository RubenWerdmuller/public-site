# Reiskantoor — reisplanner voor twee (pilot)

Deze functionaliteit staat achter de aparte route `/reiskantoor` en werkt met bestaande accounts en hun `pair_id`. In de mobiele en desktopnavigatie staat **Reiskantoor**. De bestaande dagelijkse dilemma's en weekrapporten blijven onaangeroerd.

## De vier stappen

1. **Reiscanvas:** gedeeld plan in `trip_workspaces`, met 1–12 etappes, een totale duur (2–52 weken), keuze van vertrekmaand, voorlopig maximum totaalbudget en per etappe naam, type, regio, gewenste/min/max-duur, optioneel weekbudget, geschatte reisuren, notities en een vastzetknop. Opgeslagen wijzigingen gebruiken een revisienummer; een gelijktijdige bewerking kan niet stilletjes overschreven worden. Etappes zijn verplaatsbaar.
2. **Reislogica:** `lib/reiskantoor.ts` valideert invoer, berekent min/max haalbare reisduur, houdt vastgezette etappes constant, signaleert ontbrekende aannames en past opgegeven budgetlimieten toe als alle weekprijzen zijn ingevuld. Het systeem verzint geen reisuren, klimaat of tarieven. Een onbekende prijs is geen €0.
3. **Adaptieve keuzes:** zestien versieerbare hypothetische A/B-keuzes vormen een kleine proefset met zes kenmerken (weekbudget, duur op één plek, rijuren, natuur, comfort, ontmoetingen). Een binaire logit met normale prior en MAP/Laplace-benadering schat voor elke deelnemer voorlopige gewichten met onzekerheid. De kandidaat met de hoogste benaderde expected Fisher information van beide modellen wordt geselecteerd. Alleen volledig dubbel beantwoorde rondes gaan mee; de partner ziet geen nog niet vrijgegeven antwoord.
4. **Reisvarianten:** een bounded dynamic-programming beam-search zoekt een verdeling over de etappes binnen gewenste minimum- en maximumgrenzen. De varianten richten zich op de wensen, langer verblijf, en (bij bekende kosten) goedkoop reizen, of anders wat meer ontdekken onderweg. Vanwege beperkte keuzegegevens weegt de experimentele voorkeursschatting voorlopig alleen beperkt mee in de duur van lange verblijven. Dit is geen optimaal of wetenschappelijk gevalideerd reisontwerp.

## Wat dit **niet** doet

- Geen route over echte wegen, reële afstanden, wisselende visa-, seizoens-, weer-, prijs- of beschikbaarheidsgegevens. De gebruiker geeft zelf reisuren en weekbudgetten op.
- De experimentele vragen bevatten hypothetische profielen en zijn nog **geen gebalanceerd, extern gevalideerd DCE/ACBC-ontwerp**. De modeluitvoer is voorlopig. Het getoonde label moet dat duidelijk houden.
- Geen voorspelling van de persoonlijke relatie, geen automatische beslissing, geen automatische harde grens uit een antwoord, geen ongevraagde echte boeking.
- Reissuggesties zijn weekverdelingen, **geen concrete bestemmingsvoorstellen**. Later kan een afzonderlijke geverifieerde bestemmings- en routeringslaag worden toegevoegd.

## Techniek en privacy

- Tabellen: `trip_workspaces`, `trip_choice_rounds`, `trip_choice_answers`. Het schema wordt bij database-initialisatie additief toegepast, zonder bestaande antwoorden of sessies te wissen.
- `GET /api/reiskantoor` is alleen voor een ingelogd lid van het duo. `POST` vereist dezelfde oorsprong, servervalidatie en dezelfde gebruikerssessie.
- Alleen `pair_id` bepaalt welke etappes kunnen worden gelezen/gewijzigd. `user_id` bepaalt het individuele keuzeantwoord. Een antwoord is eenmalig; een volgende ronde wordt transactioneel gekozen.
- Een compleet gezamenlijke vraag is nodig voordat antwoorden gebruikt worden om het gezamenlijke model te updaten. Onvolledige antwoorden worden niet meegenomen en niet aan de partner onthuld.
- Concurrente bewerkingen veroorzaken een revisieconflict (HTTP 409) in plaats van dat een bewerking verloren gaat.

## Controleren

```bash
npm ci
npm run typecheck
npm run lint
npx tsx --test tests/reiskantoor.test.ts
npm test
npm run build
```

Controleer handmatig op twee ingelogde browsers: plan delen; gelijktijdig aanpassen geeft HTTP 409; keuze geheim totdat beiden kiezen; daarna verschijnt een volgende adaptieve vraag. Zonder account blijft de API afgesloten.

### Mogelijke vervolgstappen

- Per etappe een echte begin- en einddatum, regiohierarchie met subetappes en volledige dependency-graph.
- Een gecontroleerde database met reisroutes, reistijden en bestemmingseigenschappen, inclusief jaartal/klimaat.
- Een experimenteel uitgebalanceerde DCE-pool, uitgestelde holdout-vragen, posterior predictive checks en kalibratie.
- Een uitlegbare multiobjective-optimalisatie met expliciete pareto-grens en persoonlijk overzicht naast het gedeelde model.
