# Scientific Trip Engine v2 — research protocol and engineering contract

**Goal:** Couple-specific, questions-first long-trip design. The app asks about overall length, outbound/return legs, nested stops, minimum long stays, flexibility and activity style, and then **computes a coherent itinerary**. The Reiskantoor remains read-only. The later AI destination engine must work *within* these constraints using verified travel data.

## Five non-negotiable invariants

1. **Conservation of time:** total selected weeks = sum(outbound weeks + return weeks + all base-stay weeks + short extra-chapter weeks + flexibility weeks). A stop in the outbound/return leg is measured in *days inside that leg*, not extra weeks.
2. **Minimum long-stay constraints:** each primary base receives at least the mutually inferred minimum number of full weeks. If impossible, return **no apparently feasible plan**; explain the conflict instead.
3. **Individual evidence:** every stage answer retains the two separate choices. If they differ, neither is secretly overwritten or presented as agreed. We compute a visible provisional joint compromise and use a minimax-style individual regret term as part of the optimiser objective.
4. **Unknown stays unknown:** "one planning day per move" is an allocation allowance, **not a route travel time**. The system does not assert a road, accommodation, weather condition, entry rule, price, or availability without a verified external source.
5. **Traceable uncertainty:** all stage and DCE tasks have versioned unique IDs; unfinished partner responses are private; Bayesian rank weights include uncertainty. No one-task "confidence %".

## Interlocking levels of planning

### L0: Inputs and adaptive questions
- Four core questions are required: total trip length, outbound, return, and number of long stays. These establish the first high-level itinerary.
- The new versioned question set expands on minimum long-stay duration, stops on outbound/return, preferred days per stop, flexible reserve weeks, driving-day intensity, preferred kind of long stay, departure period and spending envelope. Existing answers and IDs remain untouched.
- The next stage question uses a **one-step lookahead sensitivity proxy**: simulate potential combinations of answers from both people, compare the resulting achievable itineraries, and prioritize unanswered constraints that could substantially change the result. If a question doesn't meaningfully affect the itinerary yet, it is deprioritized.
- After the stage set, the existing discrete-choice pool uses a Bayesian/Laplace expected Fisher-information heuristic for the next choice task. **Neither the stage question pool nor the 16 DCE profiles currently use a formally optimized D-efficient/balanced experimental design.**

### L1: Whole-trip feasibility
- Search over integral outbound weeks, return weeks, long-stay time, optional extra chapters and free buffer, satisfying the single trip budget of weeks.
- Within these feasible solutions, soft goals penalize departure from stated preferences. Individual choice regret helps avoid a mean preference masking strongly different desires.
- When both stop count and days/stop have been answered, enforce a *minimum planning-day capacity* for each leg:
  - required days = count × preferred days per stop + count + 1 reserved planning days for movements
  - required weeks = ceil(required days / 7)
- Never label reserved movement days as route duration.
- With insufficient total weeks to accommodate the jointly preferred minimum stays and nested stop minimums, return an explicit infeasibility conflict. **Don't silently drop stops or reduce long-stay minimums.**

### L2: Preference learning and reliability checks
- Bayesian-regularized logistic MAP with Gaussian prior and local Laplace covariance for six travel attributes.
- Relative rank is shown per person, with uncertainty. It is specific to these questions, not personality, objective compatibility, or true behavior.
- For 8+ completed choice tasks per person, calculate leave-one-out predictive Brier score versus no-information chance baseline 0.250. This checks for preliminary within-bank predictive utility. Because tasks were selected adaptively and no external holdout exists, it is **not** proof of calibration or generalizability.
- Model means have strictly capped influence on the duration-optimization objective. Stage constraints still take precedence over noisy estimates.

### L3: The initial Reiskantoor output
- Several possible **complete trip scenarios**: shorter / shared / longer duration when distinct, plus separate one-base and two-base variants when the partners disagree. Each has its own consistent set of phases and explicit trade-offs.
- Nested day-by-day stop *allocations* within outbound and return, never marketed as a specific real driving itinerary.
- Qualitative stay/activity **types**, only when supported by an answer (e.g., nature/slow vs learning/community); disagreement results in multiple alternatives, not a forced "winner."
- Clear “not yet verified” status for destinations, routes, costs and availability.

### L4: Later verified-AI destination recommendations
- Candidate sourcing and freshness are outside this release. The future system should connect real geocoded places, route edges, seasonality, accommodation/experience offers, and supplier terms.
- Every result needs precise provenance and a checked-at date. Verified itinerary feasibility must consider geographic contiguity, movement times, entry rules, weather windows, total budget and availability *in addition to* the current week model.
- \`lib/destination-research.ts\` now defines a validation boundary and test fixtures. **It validates only the structure of provenance claims; it does not connect to sources or mark any suggestion bookable.**
- A future AI model should generate/rank candidate sets subject to independently fetched constraints, not fabricate a route and then rationalize it.
- To compare options fairly: use Pareto efficiency and a risk/uncertainty-aware couple objective; show at least two trade-off alternatives rather than one opaque “winner.”

## What we should measure in future iterations

- **Structural correctness:** property tests for week conservation, minimum stay, nested day capacity, absence of duplicated costs and chronology. The current unit tests cover normal and infeasible cases.
- **Study-design quality:** attribute dominance, balance, independent variation, comprehensibility, positional bias and identifying variation between preference coefficients.
- **Prediction:** held-out choices from a deliberately reserved task set (not only internal leave-one-out), Brier/log-loss, posterior intervals, parameter stability under added responses.
- **Partner fairness:** maximum individual regret, both partners' revealed choices, effects of varying total duration, and whether the user agrees with the compromise.
- **Experience:** time and number of questions until first plausible trip, completion/abandonment, trust, usefulness of follow-up questions, and user correction frequency.
- **Destination validity (future):** percentage of legs from verified graph, freshness of prices, travel-day feasibility, booking availability and citation completeness.

## Sources and limits

- Johnson et al. (2013), ISPOR *Constructing Experimental Designs for Discrete-Choice Experiments*: https://www.ispor.org/heor-resources/good-practices/article/constructing-experimental-designs-for-discrete-choice-experiments
- Hauber et al. (2016), ISPOR *Statistical Methods for the Analysis of Discrete-Choice Experiments*: https://www.ispor.org/heor-resources/good-practices/article/statistical-methods-for-the-analysis-of-discrete-choice-experiments

These references support rigorous DCE designs and estimation, **not** a claim that this specific experimental app is already validated. The time-allocation optimiser is a practical, deterministic, bounded discrete search with fairness penalties; it is not itself a Bayesian DCE or a proven globally optimal routing solver.

## Status

v2 code: stage pool extended and versioned; constrained whole-trip solver; budget-of-days constraints inside the two travel legs; scenario sensitivity-based stage question selection; model predictive diagnostics; Reiskantoor sub-stop and trip alternatives UI; future provenance gate with no booking claims. Current known limitations: geographical graph absent, questionnaire design not independently validated, individual trip weights weak with few observations, affordability cannot be confirmed without actual prices.
