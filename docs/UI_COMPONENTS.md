# UI component conventions

The **same interaction type must use the same component**, even when displayed on a different route. Do not create a new version by copying JSX.

- **PrimaryNavigation** (`components/primary-navigation.tsx`) owns the three destinations, labels, order, icons, active styles, and accessibility. Home renders it as sidebar/mobile; Vragen, Buzzer, both research screens, the legacy question flow, AI, photo credits and sketchbook all use the footer variant through `SiteNavigation`. Never reimplement primary navigation in page JSX. The primary navigation is hidden on full-screen question focus.
- **SectionHeader** (`components/site-navigation.tsx`) is the shared secondary report-page back link and heading.
- **AppAction** (`components/ui.tsx`) is for standard primary and quiet actions. Prefer `href` for navigation and `onClick` for actions; a link and a button must retain their native semantics. `SketchButton` is an intentional illustrated CTA variant, not a duplicate of the plain action.
- **AnswerChoice** and **ChoiceAttributes** (`components/ui.tsx`) own the comparable A/B choice card and its DCE attribute rows in both question flows. Their content may differ; markup, accessibility, highlights, and sizes should not drift.
- **QuickAction** (`components/ui.tsx`) is the repeated compact Home action card. The big Buzzer button is a different interaction and appropriately has its own treatment.
- **`rk-paper`** is the shared reading-panel style; `paper` remains the sketchbook/legacy visual treatment. Keep the distinction only while both design surfaces still exist.

Before adding another card, button, or navigation bar, extend the appropriate shared component or explain why its purpose truly differs. Verify the main mobile layouts at 390×844 and a short-screen viewport; longer scientific question copy must remain accessible even when scrolling is unavoidable.
