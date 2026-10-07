# Voorkeuren, grenzen en bewijs

De runtimebron is PostgreSQL: `preference_subjects`, `travel_preferences` en `preference_evidence`. `lib/preferences.ts` levert uitsluitend idempotente startdata en pure domeinfuncties. De server leest bestaande rijen, ook na aanpassingen; een volgende seed overschrijft die niet.

Een subject is een duo of persoon. Expliciet genoemde Roebie/Oelie-subjecten hebben een `person_key`. Ze worden niet op basis van een avatar of membership-slot aan een willekeurig account gekoppeld. Antwoordschattingen hebben een afzonderlijk persoonlijk subject met `user_id`. Zo wordt Roebies zeildroom nooit automatisch Oelies wens of een gezamenlijke afspraak.

Een voorkeur bevat attribuut, soort, waarde, zekerheid, bron, toelichting en optionele grens. Soorten: harde grens, zachte grens, sterke/lichte voorkeur, nieuwsgierigheid, eigen wens en open vraag. Een grens heeft apart `preferred`, `acceptable` en `hard` plus eenheid en uitzonderingen. De bekende 1,5–6 maanden is een voorlopig voorkeursbereik; 20–35 °C een zachte wens. Vegetarisch/vegan vriendelijk sluit standaard geen bestemmingen uit. Uitzonderingen zijn opgeslagen tekst, geen automatisch toegepaste toestemming om een harde afspraak te negeren.

Instellingen → Onze reisuitgangspunten laat beide reisgenoten expliciete uitgangspunten aanpassen. De server valideert waarden, zekerheid en volgorde van bereikgrenzen en controleert duo-eigendom. Dit is een gezamenlijk beheerd boekje. Persoonlijke antwoordkeuzes blijven verborgen tot beide mensen dezelfde vraag hebben beantwoord.

Bij een antwoord blijven een onveranderlijke vraag/optie-snapshot en de keuze bewaard. Numerieke verschillen leveren een eenvoudige richting per persoon/attribuut op. Die staat als `weak_preference`, bron `inferred`, met observatieaantal en conservatieve zekerheid in `travel_preferences`. Elke onderliggende keuze is via `preference_evidence` herleidbaar. Een afweging of extremenvraag wordt nooit vanzelf een harde grens. Categorische keuzes blijven in de antwoord-snapshot beschikbaar; hiervoor bestaat nog geen gekalibreerd inferentiemodel.

Gezamenlijke inzichten en weekrapporten gebruiken uitsluitend dubbel beantwoorde vragen. Afzonderlijke, nog geheime schattingen worden niet via het dashboard gedeeld. Een overeenstemmingspercentage is een speelse samenvatting van dilemma’s, geen relatievoorspelling. De inferentie is geen gevalideerde conjointanalyse en bewijst geen interacties tussen attributen.

Sets staan in `question_sets` als gedeelde, onveranderlijke geordende vraag-ID’s. `set_progress` bewaart per gebruiker/dag de gekozen set. Totalen worden uit antwoorden afgeleid, niet opgeteld bij klikken: alle werkelijke vragen in een set moeten door die persoon beantwoord zijn. Bewaren, het openen van een set en fictieve rapportdata tellen niet. Bestaande dagtoewijzingen worden additief als eerste sets overgenomen. Alle sets blijven via het archief bereikbaar, ook op een latere dag.

Een persoonlijke droom is niet hetzelfde als een persoonsgebonden toegangsscherm. Nieuwe persoonsidentificatie, vrij toevoegen van profielitems, expliciete sterktevragen en een verder adaptief model kunnen op deze tabellen voortbouwen.
