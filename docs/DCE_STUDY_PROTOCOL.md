# Reis-DNA v3 — onderzoeksprotocol vooraf

> **Productdoel en prioriteiten:** [PRODUCT_VISION.md](PRODUCT_VISION.md) is de enige leidende bron. Dit document beschrijft de bestaande implementatie en/of technische onderzoeksdetails. Bij een tegenstrijdigheid over toekomstige UX, vraagstromen of productdoelen geldt de productvisie. De uniforme Vragen-ervaring is nog **niet** gebouwd.


Status: **reproduceerbare technische pilot; nog niet extern gevalideerd**. Gericht op twee reizigers, niet op een representatieve populatie.

## Onderzoeksvraag
Kunnen we per persoon uit niet-gedomineerde, hypothetische meer-attribuut-reisvergelijkingen een indicatie van relatieve voorkeuren afleiden? En lukt het om vooraf apart gehouden keuzes beter te voorspellen dan een ongeïnformeerde 50/50-kans? Het resultaat beschrijft **stated preferences** binnen de getoonde scenario's: geen persoonlijkheid, relatiekwaliteit of echt reisgedrag.

## Attributen en niveaus
In lib/dce-design.ts staan zes attributen met drie vooraf gekozen niveaus: weekbudget voor twee, weken per verblijf, rijuren op een reisdag, natuur, comfort en ontmoetingen. De niveaukeuze is een hypothese. De schalen 1–5 zijn nog niet cognitief gevalideerd, en het ontwerp biedt nog geen opt-out/geen-van-beide mogelijkheid. Meer natuur of ontmoetingen is niet noodzakelijk monotoon beter voor alle gebruikers: de non-dominance-audit gebruikt die vereenvoudigende ontwerpaanname.

## Vastgelegd experimenteel ontwerp
- Exact 48 onveranderlijk geïdentificeerde taken, versie dce-v3.1 en een deterministisch zaad.
- 42 schattingsvergelijkingen en 6 vooraf apart gehouden holdouts, die niet in de model-fit of informatiewinstcriteria mogen komen.
- Drie tot vier kenmerken verschillen per paar, met een greedy D-efficiency-geïnspireerde selectie en geteste full-rank-identificeerbaarheid. Dit is niet bewezen globaal optimaal.
- Na elke reeks van zeven gezamenlijk beantwoorde schattingstaken volgt een vooraf gereserveerde holdout, ongeacht de gekozen antwoorden.
- De volgorde van schattingstaken is adaptief op de benaderde informatie-opbrengst voor **beide personen**.
- Historische dagelijkse vragen en het oude Reisrapport geven hooguit een kleine, afgekapt themaprioriteit aan de vraagselectie. Ze tellen nooit als nieuwe conjointmetingen.

## Model en resultaten
- Binair conditioneel logit/Random Utility, met zes persoonsgebonden coëfficiënten en een Gaussische shrinkage-prior.
- MAP-fit met Newton-stappen, Laplace-covariantie en 90%-benaderingsintervallen. We tonen geen nieuwe ranking voordat minstens vijf schattingsvragen beschikbaar zijn.
- De held-out Brier-score en logloss worden apart gerapporteerd. Een constante voorspelling van 0,5 geeft Brier=0,25 en logloss≈0,693. Een of twee holdouts zijn onvoldoende voor een sterke conclusie.
- De ranglijst in Reis-DNA laat de onzekerheid zien. Oudere speelse ranglijsten en rapportteksten verschijnen in een afzonderlijke sectie, nadrukkelijk niet als statistisch bewijs.

## Privacy
Individuele antwoorden blijven privé totdat beiden de taak beantwoorden. Persoonsprofielen worden alleen berekend uit gezamenlijk voltooide keuzetaken. Historische antwoorden worden onveranderd bewaard en nieuwe taak-ID's blijven uniek.

## Wat ontbreekt voordat validatie echt geclaimd kan worden
1. Cognitieve interviews: begrijpelijkheid van weekbudget, rijbelasting en de drie 1–5 schalen; geloofwaardigheid van de scenario's.
2. Relevantie en dekking van attributen/niveaus, interpretatie van dominant/monotoon, statistische identificatie van interacties.
3. Een aparte stabiliteitstoets met herhaalde taken en onderzoek naar links-rechts-bias en vermoeidheid.
4. Externe, niet-adaptief geselecteerde validerende keuzes en gebruikersacceptatie. Met twee personen kan geen populatieclaim gedaan worden.
5. Betrouwbaarheid van het dashboard en bescherming tegen verborgen/onafgemaakte partnerkeuzes.

## Acceptatiecriteria (technische pilot)
Tests bevestigen: full-rank, non-dominance binnen de aannames, unieke IDs, 6 holdouts, geen holdout-datagebruik in fit, voorspelbaseline, privacyfilter op gezamenlijk beantwoorde oude vragen, en een zichtbare historische rapportkaart. CI en Vercel-build groen vóór merge.

## Bronnen (methodologische richtlijnen, geen validatie van ons instrument)
- Bridges et al. (2011), ISPOR Conjoint Analysis Checklist: https://www.ispor.org/heor-resources/good-practices/article/conjoint-analysis-applications-in-health---a-checklist
- Johnson et al. (2013), ISPOR Experimental Designs for DCE: https://www.ispor.org/heor-resources/good-practices/article/constructing-experimental-designs-for-discrete-choice-experiments
- Hauber et al. (2016), ISPOR Statistical Methods for DCE: https://www.ispor.org/heor-resources/good-practices/article/statistical-methods-for-the-analysis-of-discrete-choice-experiments
