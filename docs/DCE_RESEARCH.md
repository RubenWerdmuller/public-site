# Van reisvragen naar een discrete-choice-model (DCE)

Status: onderzoeksvoorstel, **nog niet geïmplementeerd**. De huidige app is een speelse voorkeurenverkenner. Deze notitie scheidt bestaande functionaliteit van wetenschappelijk te verantwoorden uitbreiding.

## Wat bestaat al?

- 124 handgeschreven A/B-reisdilemma's met attributen in de antwoordopties, plus nieuwe vraagsets, voorkeursgrenzen en immutable antwoordsnapshots.
- `lib/preferences.ts` / `travel_preferences` leiden bij numerieke A/B-verschillen per attribuut een **richting** af (`weak_preference`, `inferred`). Er is geen geschatte nutsfunctie, geen gecorrigeerd experimentontwerp en geen gekalibreerde waarschijnlijkheid.
- Een gelijk antwoord van twee personen is geen gekwantificeerd bewijs dat de gezamenlijke reis dat attribuut belangrijk vindt. Samen beantwoorden is een aparte privacyregel; expliciete grenzen zijn geen geschatte trade-offs.

## Wat is een echt Discrete Choice Experiment?

Bij elk dilemma kiest één persoon tussen twee volledig gespecificeerde alternatieven met vooraf ontworpen, vergelijkbare attribuutniveaus. Een eenvoudig conditioneel logitmodel gebruikt:

`P(A gekozen | A,B, gebruiker) = sigmoid(beta_gebruiker · (x_A - x_B))`

De coëfficiënten (part-worths) drukken **relatieve** voorkeuren uit, binnen een bewust ontworpen set attributen en niveaus. De grootte is zonder normalisatie/identificatie niet vrij interpreteerbaar. De resultaten blijven stated preferences, geen bewezen werkelijk reisgedrag.

**Gevolg voor de huidige vragenbank:** als A tegelijk langer, goedkoper, rustiger en warmer is, kan één keuze niet verklaren welk attribuut doorslaggevend was. Veel originele dilemma's wisselen méér attributen tegelijk, met niet-uniforme eenheden of zonder beide waarden. Deze data mogen niet automatisch als geïdentificeerde DCE-coëfficiënten worden gepresenteerd.

## Wetenschappelijk verantwoord pad

1. **Klein kernmodel.** Kies bijvoorbeeld 5–7 voor deze reis relevante attributen: maandbudget voor twee, reisduur, rijbelasting per reisetappe, temperatuur, verhuisfrequentie, sociale drukte en tijd voor eigen activiteiten. Definieer voor elk 3–5 realistische niveaus en eenheden. Laat eigen dromen/waarden als kwalitatieve, persoonlijke context bestaan. Harde grenzen worden expliciet vastgelegd, nooit uit een A/B-antwoord afgeleid.
2. **Ontwerp nieuwe DCE-vragen.** Balanceer welke attributen en niveaus voorkomen; gebruik realistische en niet-gedomineerde combinaties. Neem alternatieven die een echte ruil vragen, bijvoorbeeld minder rijtijd tegen hogere kosten. Randomiseer links/rechts en voeg af en toe een herhaalvraag toe voor stabiliteit. Bewaar ontwerpversie en exacte alternatiefvectoren. Vraag eventueel waarom iemand koos of welke factor hij/zij negeerde.
3. **Model v1: geregulariseerde conditional logit.** Schat een apart, sterk geregulariseerd klein coëfficiëntenmodel per persoon. Gebruik conservatieve onzekerheidsweergave en toon bij weinig data 'nog onvoldoende informatie'; evalueer tegen heldere eenvoudige regels en op achtergehouden keuzes. Voor slechts twee personen is een 'populatiegeleerd' hierarchical-Bayes-model niet vanzelf gerechtvaardigd.
4. **Model v2: adaptieve vragen.** Kies uit een vooraf gecontroleerde vragenpool de volgende *gezamenlijke* vraag die de verwachte onzekerheid voor beide personen het meest verkleint, rekening houdend met thema-afwisseling, eerder gestelde vragen en gebruikslast. Bewaar ieders antwoord apart en houd het geheim totdat beiden de vraag beantwoorden. Bayesian expected information gain / D-efficiency zijn opties, geen garantie op kwaliteit.
5. **Model v3: reiskeuzes en overleg.** Laat schattingen (met brede intervallen) per persoon naast elkaar zien. Gebruik pareto-achtige opties die geen van beiden onnodig benadelen en laat beide personen impliciete compromissen expliciet bevestigen. Bestemmingen worden pas gerangschikt als hun kenmerken betrouwbaar beschikbaar zijn en grenzen toegepast kunnen worden; een hoge voorspelde kans is geen reisadvies of relatie-score.

## Meet vóór je 'wetenschappelijk' zegt

- **Identificeerbaarheid:** verandert ieder attribuut onafhankelijk genoeg van de andere? Zijn opties onbedoeld gedomineerd?
- **Voorspellende waarde:** log loss / Brier score en een herhaal- of holdoutset, naast een simpele baseline.
- **Kalibratie en onzekerheid:** hoeveel antwoorden per persoon zijn nodig om een conclusie te tonen? Rapporteer onzekerheid.
- **Responsbelasting:** blijft vier vragen per dag prettig? Zijn vragen begrijpelijk, realistisch, niet sturend?
- **Privacy:** nooit andermans nog niet vrijgegeven keuzes of individuele gewichten tonen voordat dat past bij de duo-afspraak.

## Kleine eerste stap zonder risico voor bestaande accounts

Bouw eerst een aparte, versiebeheerbare experimentele vraagpool en offline simulaties met synthetische gebruikers. Maak een wetenschappelijk DCE-spoor **naast** de huidige speelse 124 vragen. Verander bestaande snapshots, ingevulde antwoorden, weekvragen of productie-inferenties niet stilzwijgend. Vervang de huidige '`weak_preference`'-heuristiek alleen na vergelijkende tests en expliciete migratie.

## Literatuur

- Bridges et al. (2011), *Conjoint Analysis Applications in Health—A Checklist*, ISPOR: https://www.ispor.org/heor-resources/good-practices/article/conjoint-analysis-applications-in-health---a-checklist
- Johnson et al. (2013), *Constructing Experimental Designs for Discrete-Choice Experiments*, ISPOR: https://www.ispor.org/heor-resources/good-practices/article/constructing-experimental-designs-for-discrete-choice-experiments
- Hauber et al. (2016), *Statistical Methods for the Analysis of Discrete-Choice Experiments*, ISPOR: https://www.ispor.org/heor-resources/good-practices/article/statistical-methods-for-the-analysis-of-discrete-choice-experiments
- Toubia, Hauser & Garcia (2007), *Probabilistic Polyhedral Methods for Adaptive Choice-Based Conjoint Analysis*: https://doi.org/10.1287/mksc.1060.0257
- Gibbard & Sadlier (2025), *Optimal adaptive Bayesian design in choice experiments*: https://doi.org/10.1007/s11002-025-09768-4
