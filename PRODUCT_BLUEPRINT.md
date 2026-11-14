# STILL Product Blueprint and Reference Audit

**Audit date:** 2026-11-13  
**Reference:** [Life OS reference](https://server-side-sunrise.lovable.app/)  
**Scope:** Browser-visible reference behavior and the existing STILL workspace. This is an audit and roadmap, not an implementation request.

> No application code or existing data was changed for this audit. The reference website's private source and backend are not available; statements about its data architecture are limited to what its UI reveals.

## 1. Executive summary

The reference presents ten top-level destinations: Home, Tasks, Projects, Journal, Goals, Finance, People, Wishlist, Search, and Settings. Its strongest visible product ideas are a multi-domain dashboard, date-based task views with project links, mood-aware journaling, goal progress, relationship reminders, and a cross-module search.

STILL already has a working Next.js shell, a local-first dashboard, CRUD screens for Tasks, Journal notes, and Finance expenses, a reusable IndexedDB repository, Quick Capture, and persistent Profile/Appearance settings. Projects, Goals, People, Wishlist, and Search are not implemented as working STILL routes. Several reference controls look actionable but did not change the page when tested, so the roadmap should target confirmed behavior and treat those unimplemented reference affordances as product choices—not requirements inferred from labels.

**Recommended first milestone:** establish Projects as a real local module and connect existing tasks to projects through an additive IndexedDB schema upgrade. This delivers the clearest cross-module reference relationship while exercising the existing repository and preserving all task, note, and expense records.

## 2. Reference module hierarchy

```text
Life OS
├── Workspace
│   ├── Home
│   │   ├── Today's priorities
│   │   ├── This week (completed tasks, spending, mood, daily activity)
│   │   ├── Tasks overview
│   │   ├── Active projects
│   │   ├── Goals progress
│   │   └── Quick journal
│   ├── Tasks
│   │   ├── Today
│   │   ├── Upcoming
│   │   ├── All open
│   │   └── Completed
│   ├── Projects (overview cards; no detail route observed)
│   └── Journal (dated mood entries; no detail route observed)
├── Life
│   ├── Goals (progress cards; no detail route observed)
│   ├── Finance (category totals and recent expenses)
│   ├── People (relationship reminders)
│   └── Wishlist (purchase checklist)
└── System
    ├── Search
    └── Settings
```

All ten routes loaded without an authentication prompt. The site also displays an external “Edit with Lovable” badge; it is not part of the Life OS product navigation.

## 3. Reference feature inventory

### Home

**Purpose and structure:** Daily landing page with a personalized greeting and date, a due/overdue summary, and sections for priorities, the current week, overall task status, active projects, goals, and a quick journal entry.

- Today's priorities list five tasks with completion checkboxes, due labels, and priority labels; project names appear on linked tasks.
- This week shows tasks completed, spending, average mood, and seven daily activity/mood marks.
- Tasks overview shows due-today, overdue, upcoming, completed, and overall-completion values.
- Active-project and goal sections summarize progress and link to their top-level pages.
- Quick journal has five mood choices, a one-line entry field, and Save entry. Text enables the save button. Mood selection did not visibly change selection in the tested control; submission was not attempted to avoid creating reference data.
- Customize and the global Quick add button did not open a panel or visibly change state when clicked.
- “View all” links navigate to Tasks, Projects, Goals, and Journal.
- On mobile, the dashboard becomes one long vertical page. At 390px it had no horizontal overflow.

**Data visible:** seeded tasks, project names, expenses, and dated mood entries. The UI shows cross-module summaries, but their private storage and update mechanisms cannot be verified from the browser.

### Tasks

**Purpose and structure:** A task list segmented into Today, Upcoming, All open, and Completed tabs. Today also groups overdue and today's tasks. Rows show completion, due date, priority, and sometimes a project.

- The four tabs changed the displayed groups and records when tested.
- An inline title field enables Add task after text is entered. Clicking Add task did not add the temporary audit title to the list.
- Checkboxes are presented for completing/uncompleting tasks. A tested checkbox did not change state.
- Delete controls are visible. They were not used because deletion is destructive.
- No edit/detail view or task-creation form was observed. No sorting control was visible.
- Upcoming tasks include future dates and project links; project and priority are visible as metadata.
- A temporary title used to probe the add control was not saved and disappeared on navigation.

### Projects

**Purpose and structure:** Overview cards for active and paused projects. Cards show a description, completion percentage, completed/total task count, due date when present, and an open task.

- Four sample projects appeared: three active and one paused.
- Project cards/headings did not navigate to a detail page when clicked.
- No create, edit, archive, or delete control was visible.
- The dashboard links to this overview; tasks also display associated project names.
- Project-task relationships are observable in presentation, but their implementation and persistence are not.

### Journal

**Purpose and structure:** A chronological list of daily entries. Each entry shows weekday/date, a mood emoji and label, and free text.

- Five dated entries appeared in reverse chronological order.
- Write entry did not open a dialog or visibly change the page when clicked.
- Delete controls are visible but were not used because deletion is destructive.
- The dashboard's Quick journal offers the same five mood labels and a one-line entry field.
- STILL's Journal is a general note list, so it does not currently have mood or daily-entry structure.

### Goals

**Purpose and structure:** Measurable targets grouped by life area. Each card shows goal title, percentage, current/target value and unit, optional due date, and Update progress +/- controls.

- Four sample goals appeared in Health, Growth, Finance, and Mind.
- New goal did not open a form or otherwise visibly change the page when clicked.
- Increase/decrease controls did not change the tested goal value.
- The dashboard links to Goals and displays a subset of the goal progress.
- No edit/delete controls or nested goal pages were observed.

### Finance

**Purpose and structure:** A spending log with a Total logged amount, category-level totals, and recent expenses showing description, category, date, and amount.

- The sample total is ₹8,039; category totals are Home, Food, Social, Transport, Health, and Subscriptions.
- Recent expenses appear newest first and have delete buttons. Delete actions were not tested.
- Log expense did not open a dialog or visibly change the page when clicked.
- The page explicitly says, “Budgets and accounts come later.” Budgets and account management are not present in the inspected UI.
- No filters, date-range controls, or sorting controls were visible.

### People

**Purpose and structure:** Relationship reminders ordered by time since last contact. Each record shows initials, name, relationship, optional personal note, last-talked age, and a Talked today button.

- Five contacts appeared, with the longest-ago contact first.
- Talked today was not activated because doing so could alter a sample contact's reminder date.
- No create/edit/delete controls or detail views were visible.
- The task list includes a task mentioning Maya, but no automatic link to the People record was demonstrated.

### Wishlist

**Purpose and structure:** Purchase checklist with item name, priority, price, and an aggregate count/total. The aggregate excludes the already-bought item: “3 items · ₹16,699 total” corresponds to the three unchecked rows.

- Four rows appeared; one was already checked as bought.
- The tested unchecked item's checkbox did not visibly change state.
- No add, edit, delete, category, or detail controls were visible.
- No direct Finance relationship was demonstrated.

### Search

**Purpose and structure:** A single “Search everything…” field with live results linking to their module.

- Searching “portfolio” returned three task results and one project result, each linking to Tasks or Projects.
- No filters, sort controls, advanced-search panel, or empty-state copy was visible in the initial state.
- The desktop sidebar advertises “Press / to search”; pressing `/` did not focus the field or navigate in the tested session.
- Search results establish observable task/project coverage, not guaranteed search coverage for every module.

### Settings

**Purpose and structure:** Profile, Appearance, and Demo data sections.

- Name field and currency select (INR, USD, EUR, GBP).
- Theme radio options: Dark, Light, AMOLED. Copy says custom themes are coming later.
- Demo data copy says records are saved in the browser; Reset demo data is destructive and was not clicked.
- The previous Settings-specific work verified persistence in STILL. For the reference, this audit observed the controls but did not change its saved profile or theme; Reset demo data was not clicked.
- STILL has corresponding persisted name/currency/theme settings. It intentionally does not expose a destructive reset of user-owned IndexedDB records.

## 4. Component and interaction inventory

| Component / location | Default and purpose | Tested result / behavior | Mobile equivalent |
|---|---|---|---|
| Desktop sidebar | Grouped Workspace, Life, System links; active route styling | All ten navigation destinations were accessible | At 768–1023px it collapses to a 72px icon rail; below 768px it is replaced by bottom navigation |
| Mobile bottom navigation | Home, Tasks, Quick add, Journal, More | More did not reveal additional navigation when tested | Fixed bottom bar; only the four named destinations are directly visible |
| Home dashboard sections | Task, week, project, goal and journal summaries | “View all” links route to modules; Customize did not open a customization UI | Sections stack vertically |
| Task filter tabs | Today, Upcoming, All open, Completed | Filtered list content when tested | Same tab set; horizontal fit/overflow was not seen at 390px |
| Task quick-add input | Single task title and Add task button | Button enabled after text; test record was not added | Same inline creation affordance |
| Task checkboxes | Completion state | Tested task checkbox did not change state | Same checkbox |
| Task delete buttons | Remove a row | Visible; not exercised because destructive | Same row action may require touch access |
| Project cards | Summary of project progress and next open task | Clicking a card title did not open details | Cards stack in a single column |
| Goal progress controls | Increase/decrease current value | Tested +/- controls did not alter the value | Same card controls |
| Journal quick form | Mood radio group, one-line text, Save entry | Text enables Save; radio click did not visibly change selection; save not submitted | Form is part of the stacked dashboard |
| Journal Write entry | Entry creation affordance | Click produced no visible form | Same button |
| Finance Log expense | Expense creation affordance | Click produced no visible form | Same button |
| People Talked today | Update contact recency affordance | Not tested because it could mutate sample data | Same button in each contact card |
| Wishlist bought checkbox | Mark item purchased | Tested checkbox did not change state | Same checklist control |
| Global Quick add | Floating action button on desktop; Quick add in mobile navigation | Click did not open a dialog | Button in bottom navigation |
| Search field | Search route, live result list | Query returned task and project results | Dedicated route; input remains available |
| Settings controls | Name, currency, theme, demo reset | Preference persistence tested in the prior Settings audit; reset not tested | Settings page with mobile shell |
| Toast/loading/error/empty states | Notification region exists; route transitions briefly show Loading | No save toast or error state was triggered in the reference; empty states were not observable with seeded content | Same application shell |

**Reference interaction confidence:** Task tabs and Search are confirmed working. Some controls are visible but did not respond in the browser; others were intentionally not activated because they could alter/delete seeded records. Do not equate visible buttons with completed workflows.

## 5. Reference visual design system

Values below are browser-computed CSS values or exposed custom properties from the loaded reference. They are not estimates from screenshots.

### Typography

- Body and controls: `Geist`, sans-serif. Body computed at 16px / 24px, weight 400.
- Main page headings: `"Instrument Serif", ui-serif, Georgia, serif`; the Home heading computed to 60px / 63px at 1440px viewport and 36px / 37.8px at 390px.
- Controls commonly use 12px / 16px, weight 500; navigation uses 14px / 20px.
- Heading weight is generally 400 with tight negative tracking. The reference uses restrained uppercased section kickers.

### Colors

| Role | Observed value |
|---|---|
| Main background | `oklch(14.5% .004 80)` |
| Sidebar | `oklch(13% .004 80)` |
| Card/surface | `oklch(17.2% .004 80)` |
| Raised surface | `oklch(20% .005 80)` |
| Main text | `oklch(95% .006 85)` |
| Muted text | `oklch(66% .01 80)` |
| Subtle text | `oklch(50% .008 80)` |
| Warm accent / primary | `oklch(82% .11 78)` |
| Success | `oklch(74% .12 155)` |
| Warning | `oklch(80% .12 78)` |
| Destructive | `oklch(66% .17 25)` |
| Standard border | `oklch(100% 0 0 / .07)` |
| Strong border | `oklch(100% 0 0 / .13)` |

### Spacing, layout, and component styling

- Tailwind spacing base observed as `.25rem` (4px).
- Desktop sidebar: 240px; compact tablet sidebar: 72px.
- Main content occupies the remaining viewport, with a centered content column and responsive padding.
- Card radius observed at 16px; navigation active radius at 12px; button radius at 10px. Root radius token is `.75rem`.
- Cards use subtle borders and low-elevation shadow. Active navigation uses a raised surface. Accent is a muted warm gold; success/warning/destructive use restrained semantic colors.
- No prominent gradients or chart-heavy decoration. The dashboard has compact, functional weekly activity marks.

### Responsive behavior

- Below 768px: desktop sidebar hidden; a 56px mobile header and fixed bottom navigation appear. Home, Tasks, Journal, Quick add, and More are shown.
- 768–1023px: 72px icon-only sidebar; bottom navigation hidden.
- At 1024px and wider: 240px full sidebar with labels.
- At tested viewport widths 390, 768, 1024, and 1440, all ten routes had matching document client/scroll widths (no horizontal overflow). Content becomes a vertical stack at mobile widths.
- Desktop, tablet, and mobile layouts were inspected through rendered routes. No authentication or permissions gate blocked access.

## 6. Existing STILL architecture audit

### Application setup

- Next.js 16 App Router, React 19, TypeScript strict mode, Tailwind CSS 4. No UI component library or other runtime dependencies are declared.
- Shared layout is `src/app/layout.tsx`; page routes use a common `AppShell`.
- Package scripts: `dev`, `build`, and `lint`. No test files were found under `src`.
- The existing Next.js-specific instructions are in `AGENTS.md`; product design constraints are in `.github/copilot-instructions.md`.

### Current routes

| STILL route | Current implementation |
|---|---|
| `/` | Dashboard using live local Tasks, Notes, and Expenses |
| `/tasks` | Task list with create/edit/delete, completion, filters, detail disclosure |
| `/journal` | Notes list with create/edit/delete and a detail dialog |
| `/finance` | Expense list with create/edit/delete and total |
| `/settings` | Profile, currency, theme, local-data information |
| Projects, Goals, People, Wishlist, Search | No route; sidebar entries for Projects, Goals, People, Wishlist are disabled placeholders; topbar Search is not wired to a search route |

### Reusable UI inventory

- Shell/navigation: `AppShell`, `Sidebar`, `NavigationLinks`, `Topbar`, `MobileNavigation`.
- Dashboard: `SummaryMetric`, `TaskRow`, `ActivityOverview`, `SectionHeading`, `DetailPanel`.
- Forms and states: `ModalDialog`, `QuickCapture`, `ScreenHeader`, `EmptyState`, `LoadingState`, `ErrorNotice`.
- Shared icon component: `Icon`.
- Local record hooks: `useLocalRecords`, `usePreferences`.

These are the preferred reuse points. A new component should only be introduced where a real pattern cannot be represented by the existing pieces.

### Local data and persistence

- One IndexedDB database, `life-os-local`, schema version 1, with `tasks`, `notes`, and `expenses` stores.
- Shared generic repository implements create, get, list, update, and delete; typed wrappers and validators exist for each record.
- Records contain IDs and created/updated timestamps. Tasks contain title, completion, optional notes/due date; Notes contain content and optional title; Expenses contain description, amount, and optional notes.
- A local data event refreshes same-tab screens; `useLocalRecords` also reloads on window focus. There is no backend, authentication, cloud sync, import/export, attachment store, or cross-device sync.
- Preferences are separate from IndexedDB: versioned `localStorage` key `still:preferences:v1` for name, currency (INR/USD/EUR/GBP), and dark/light/AMOLED theme. Existing user records are not affected by preference changes.
- Any future record type should reuse this database/repository and use additive versioned upgrades. Never create a second database or clear existing stores.

### Current design and responsive behavior

- Still uses Geist and Geist Mono, near-black/charcoal surfaces, muted text, olive accent, and CSS custom properties in `src/app/globals.css`.
- Key default tokens include background `#10110f`, surface `#151714`, sidebar `#121410`, foreground `#eeeee9`, secondary text `#92958c`, line `#292c27`, and accent `#c4cbb2`.
- Spacing tokens use 4px increments; control/panel radii are 5px/8px; subtle transition is 160ms. Dark, Light, and AMOLED token sets exist.
- Desktop sidebar is 232px. At 760px and below, the app uses a compact header and expandable mobile navigation; there is no bottom navigation. Additional breakpoints include 1100px, 960px, 560px, 400px, and an 850px Settings grid breakpoint.
- The CSS is centralized in a large `globals.css` with repeated responsive blocks. During later design-system work, consolidate only as directly related styles are touched; avoid a wholesale redesign.
- The existing approved STILL visual identity differs intentionally from the reference: STILL uses a sans-serif-led charcoal/olive treatment rather than the reference's serif-heading/warm-gold treatment.

### Current module status

- **Dashboard — PARTIAL / DIFFERENT:** Real summaries, recent tasks and notes, expense total, and seven-day record activity. No weekly mood log, project/goal summaries, date-based task totals, or working customization.
- **Tasks — PARTIAL / DIFFERENT:** Local CRUD, All/Active/Completed filters, completion toggles, task detail disclosure, title/notes/due date. Missing reference Today/Upcoming segmentation, priority, and project relation.
- **Journal — DIFFERENT:** Local Notes CRUD is working, but records are generic notes rather than dated mood entries.
- **Finance — PARTIAL:** Local Expense CRUD, overall total, preferred-currency formatting. Missing category breakdown, date-window totals, and budgets/accounts.
- **Settings — COMPLETE for profile/currency/theme; DIFFERENT for reset:** Preferences persist and affect the app. A demo reset is deliberately not provided because it could erase user-owned records.
- **Quick Capture — COMPLETE for current scope:** Task/Note/Expense preview and save to IndexedDB, basic validation, success confirmation, and Ctrl/Cmd+J shortcut. This is more functional than the reference's observed Quick add button.
- **Projects, Goals, People, Wishlist — MISSING.**
- **Search — PARTIAL:** Topbar field exists, but does not search; no `/search` route.

## 7. Master reference-versus-STILL comparison

| Module / feature | Reference behavior | STILL status | Required action | Priority |
|---|---|---|---|---|
| Shell and navigation | Grouped desktop sidebar; compact tablet rail; mobile bottom bar | **PARTIAL** — common shell works; several links are disabled; mobile uses expandable menu | Activate routes incrementally; make every visible destination reachable on mobile | High |
| Home daily priorities | Date-based tasks with project and priority metadata | **PARTIAL** — recent saved tasks, no due-date grouping or priority/project fields | Add due-date summary and metadata only after task model supports it | High |
| Home weekly view | Completed work, spend, mood, daily marks | **PARTIAL / DIFFERENT** — seven-day count of saved local records, no mood or per-day spending | Add only after structured journal/date data exists | Medium |
| Home project/goal summaries | Active project and goal progress links | **MISSING** | Derive summaries from real module records; do not mock them | High |
| Dashboard customization | Customize button shown; click had no visible result | **MISSING** | Treat as unimplemented reference affordance; defer until user confirms desired configuration | Later |
| Tasks CRUD | Inline task addition, completion, deletion presented | **COMPLETE in STILL** for local CRUD/status; reference create/check controls did not respond in probe | Preserve current CRUD; implement reliable reference-style workflows in STILL as needed | High |
| Task views | Today, Upcoming, All open, Completed; date grouping | **DIFFERENT** — STILL has All, Active, Completed | Extend existing task screen; do not replace its current filters | High |
| Task metadata | Priority and project shown in rows | **PARTIAL** — due date/notes exist; priority/project do not | Add optional fields and relationships without invalidating existing records | High |
| Task details/edit | No reference detail/edit view observed | **COMPLETE in STILL** — disclosure and edit form exist | Preserve; no duplicate detail implementation | Medium |
| Projects overview | Status, description, progress, task counts, due date, open task | **MISSING** | Add persistent Projects model/route and derive task progress | Critical |
| Project details/CRUD | No detail route or management controls observed | **MISSING in STILL; not confirmed in reference** | Do not invent a reference detail workflow; define minimal CRUD scope before implementation | Medium |
| Journal daily mood entries | Date, mood, free-text entry | **DIFFERENT** — generic Notes CRUD | Decide whether to extend note records or add a distinct journal-entry type; preserve notes | High |
| Journal creation/deletion | Write entry and delete affordances shown; creation click produced no form | **PARTIAL** — Notes create/edit/delete already work | Keep current note workflows; implement only approved journal-specific behavior | High |
| Goals/progress | Life area, target/current/unit/date, progress controls | **MISSING** — reference controls did not alter state in probe | Add model and progress UI after module foundation | High |
| Finance totals | Total and category totals | **PARTIAL** — overall expenses total only | Add category and period summaries using a non-destructive Expense extension | High |
| Finance records | Recent expense description/category/date/amount | **PARTIAL** — description/created date/amount; no category field | Add optional category and filters; retain current expense records | High |
| Budgets/accounts | Reference explicitly says these come later | **MISSING in both** | Defer; not required for parity with current reference | Later |
| People reminders | Contact, relationship, note, last-talked age, Talked today action | **MISSING** | Add local contact model and reminder behavior after approval | Medium |
| Wishlist | Bought checkbox, priority, price, aggregate | **MISSING** | Add local model and calculated unchecked-item aggregate | Medium |
| Global Search | Live task/project results from query | **PARTIAL** — topbar input is inert; no route | Add `/search` using existing local repositories; mobile navigation access | High |
| Settings profile/theme/currency | Browser-saved name, currency, three themes | **COMPLETE** for corresponding STILL settings | Preserve existing preference model and CSS token application | Complete |
| Settings demo reset | Destructive restoration of sample content | **NOT APPLICABLE** — STILL has no sample dataset; user records are real local data | Keep non-destructive Local data explanation; do not add reset | Not applicable |
| Quick Capture | Global Quick add button; click had no visible result | **COMPLETE in STILL** for Task/Note/Expense saving | Preserve current modal, validation, shortcut, and success message | Complete |

## 8. Module implementation blueprints

### Projects

**Purpose:** Group related tasks into larger efforts and show progress.

- **Reference features:** Active/paused status, description, due date, task counts, progress percentage, one open task. Only an overview was observed.
- **Existing STILL:** No route, model, or project relationship.
- **Required work:** Add a Projects record type and route; associate tasks with projects; compute completion from current task state. Keep unassigned existing tasks valid.
- **Reusable existing components:** `AppShell`, `ScreenHeader`, `EmptyState`, `ErrorNotice`, `LoadingState`, `ModalDialog`, `DetailPanel`, `TaskRow`, `useLocalRecords`, generic local repository.
- **New components genuinely required:** Project editor and project summary/detail presentation if a detail workflow is approved. No new shell or modal system.
- **Dependencies:** Additive IndexedDB version upgrade; optional `projectId` on Task; dashboard summary depends on real project data.
- **Priority / complexity:** Critical / Large.

### Tasks

**Purpose:** Capture and organize actions, including work attached to projects.

- **Reference features:** Today/Upcoming/All open/Completed views, overdue grouping, priority, due date, completion, project label, add and delete affordances.
- **Existing STILL:** Local CRUD, All/Active/Completed filters, completion, edit form, optional notes and due date, detail disclosure, delete confirmation.
- **Required work:** Preserve existing behavior; add Today/Upcoming date filters and optional priority/project metadata after the Project model exists. Avoid changing the task's identity or clearing current records.
- **Reusable existing components:** `TasksScreen`, `TaskRow`, `DetailPanel`, `ModalDialog`, `useLocalRecords`, `tasks` repository.
- **New components genuinely required:** None for filters/metadata; extend existing task editor and row.
- **Dependencies:** Projects for project assignment; date-boundary rules for Today/Upcoming.
- **Priority / complexity:** High / Medium.

### Journal

**Purpose:** Capture dated reflections and mood, while STILL already has general notes.

- **Reference features:** Chronological daily mood entries and text; dashboard quick journal.
- **Existing STILL:** Notes CRUD with optional title, body preview, detail/edit dialogs; Quick Capture creates notes.
- **Required work:** Add mood/date semantics without turning existing note records into invalid or lost data. Decide whether Journal entries should be distinct from generic Notes before schema work.
- **Reusable existing components:** `JournalScreen`, `ModalDialog`, `ScreenHeader`, `EmptyState`, `useLocalRecords`, `notes` repository, `QuickCapture`.
- **New components genuinely required:** Mood selector / daily-entry form if the distinct journal workflow is approved.
- **Dependencies:** Data-model decision; dashboard weekly mood depends on this data.
- **Priority / complexity:** High / Medium.

### Finance

**Purpose:** Record expenses and summarize spending.

- **Reference features:** Category totals, recent categorized expenses, amount/date, total; no budgets/accounts yet.
- **Existing STILL:** Expense CRUD, total, amount validation, local date display, preferred currency.
- **Required work:** Add optional category and transaction date with defaults for existing records; implement category and period summaries. Keep currency as formatting only; do not convert stored amounts.
- **Reusable existing components:** `FinanceScreen`, `ModalDialog`, `ScreenHeader`, `EmptyState`, `useLocalRecords`, expense repository, formatters, currency preference.
- **New components genuinely required:** Category select and period filter only if approved; reuse current form and list.
- **Dependencies:** Additive Expense model extension; dashboard summary can reuse computed totals.
- **Priority / complexity:** High / Medium.

### Goals

**Purpose:** Track measurable targets across life areas.

- **Reference features:** Goal area, title, current/target amount, unit, due date, percent, progress controls.
- **Existing STILL:** Dashboard has no real goals; no route/model.
- **Required work:** Add goal records, progress validation, CRUD or update workflow, empty/error states, and a real dashboard summary.
- **Reusable existing components:** `AppShell`, `ScreenHeader`, `DetailPanel`, `ModalDialog`, local repository/hooks, dashboard section patterns.
- **New components genuinely required:** Goal editor and progress control if the module is approved.
- **Dependencies:** Independent local store; future connections to finance/journal require explicit relationships.
- **Priority / complexity:** High / Medium.

### People

**Purpose:** Keep relationship context and surface contacts not spoken to recently.

- **Reference features:** Person, relationship, note, last-contact age, Talked today affordance.
- **Existing STILL:** No route/model.
- **Required work:** Add local contact records and a safe last-contact update. The reference action's exact result was not tested because it could mutate seed data.
- **Reusable existing components:** `AppShell`, `ScreenHeader`, `EmptyState`, `ModalDialog`, local repository/hooks.
- **New components genuinely required:** Contact editor and contact summary row/card.
- **Dependencies:** Independent; optional links from tasks must not be assumed from matching text.
- **Priority / complexity:** Medium / Medium.

### Wishlist

**Purpose:** Track planned purchases and distinguish bought from unbought items.

- **Reference features:** Name, priority, price, bought state, unbought count and total.
- **Existing STILL:** No route/model.
- **Required work:** Add local records and compute totals from unbought items. The reference checkbox did not visibly toggle in the test.
- **Reusable existing components:** `AppShell`, `ScreenHeader`, `EmptyState`, `useLocalRecords`, generic repository, currency formatter.
- **New components genuinely required:** Wishlist row/editor if management is approved; no bespoke list framework.
- **Dependencies:** Independent. Do not automatically create Finance expenses for purchases without explicit user-approved behavior.
- **Priority / complexity:** Medium / Small–Medium.

### Search

**Purpose:** Find records across the user's local space.

- **Reference features:** Live text query with task and project results observed; `/` shortcut is advertised but did not work in the test.
- **Existing STILL:** Topbar search input only; no route or search service.
- **Required work:** Add a search route and local result aggregation; search only fields the user expects (e.g. task title/notes, note title/body, expense description/category, project title/description).
- **Reusable existing components:** `AppShell`, `Icon`, `ScreenHeader`, local repositories and hooks.
- **New components genuinely required:** Search results list and empty state; no extra search dependency is necessary for current local data sizes.
- **Dependencies:** Searchable models; route/navigation access on both mobile and desktop.
- **Priority / complexity:** High / Medium.

### Home dashboard

**Purpose:** Surface a calm, useful summary of work and life areas.

- **Reference features:** Today's tasks, weekly completion/spend/mood, task overview, projects, goals, quick journal.
- **Existing STILL:** Live task/note/expense metrics, recent task/note lists, seven-day saved-record activity.
- **Required work:** Extend existing dashboard sections as real modules arrive; avoid replacing current live-data behavior with reference sample values.
- **Reusable existing components:** `Dashboard`, `SummaryMetric`, `TaskRow`, `ActivityOverview`, `SectionHeading`, `DetailPanel`, `useLocalRecords`.
- **New components genuinely required:** None for established summary patterns; widget customization is deferred because the reference Customize control did not respond.
- **Dependencies:** Projects, Goals, and Journal data before corresponding dashboard summaries.
- **Priority / complexity:** High / Medium.

### Settings and Quick Capture

**Purpose:** User preferences and fast local record entry.

- **Reference features:** Profile, currency, theme, destructive sample reset; global Quick add button.
- **Existing STILL:** Persisted Profile/Appearance settings and functional Task/Note/Expense Quick Capture with preview, validation, local save, success feedback, and shortcut.
- **Required work:** Preserve these features. Keep the existing non-destructive Local data explanation; no reset is needed for a real-data local-first app.
- **Reusable existing components:** `SettingsScreen`, `usePreferences`, `ModalDialog`, `QuickCapture`, existing currency formatters.
- **New components genuinely required:** None for current parity.
- **Dependencies:** None.
- **Priority / complexity:** Complete / Small maintenance only.

## 9. Missing functionality and reuse strategy

### Highest-impact gaps

1. Projects route/model and task relationship.
2. Task date views plus project/priority metadata.
3. Global Search route and a working topbar/mobile entry point.
4. Structured Journal mood/date entries, distinct from generic notes if product semantics require it.
5. Goals, Finance categories, People reminders, and Wishlist local records.
6. Dashboard summaries derived from the above records.
7. Consistent mobile discoverability for every enabled module.

### Reuse before adding components

- Keep `AppShell`, navigation primitives, and `Icon`; extend their item definitions instead of introducing a second shell.
- Keep generic `createLocalRepository`, typed record wrappers, validators, event notifications, and `useLocalRecords`.
- Keep `ModalDialog`, form/state components, `ScreenHeader`, `EmptyState`, `ErrorNotice`, and `LoadingState`.
- Extend `TaskRow` and `TasksScreen` for optional priority/project metadata rather than creating a parallel task list.
- Reuse currency/date formatters; avoid module-specific one-off currency formatting.
- No duplicate database, repository, preference store, modal, or form system should be introduced.

### Data-safety notes

- Existing IndexedDB is version 1 with user-owned Tasks, Notes, and Expenses. New stores/fields must be added via an additive `onupgradeneeded` migration; do not delete/recreate records.
- New task relationship fields should be optional to preserve older task records.
- If journal metadata, categories, or dates are added, use safe defaults for pre-existing records and preserve IDs, content, createdAt, and updatedAt.
- No currency conversion should happen when a preference changes.
- No cross-module side effects (e.g. bought Wishlist item creating Finance expense) are supported by observed reference behavior; do not implement without approval.

## 10. Development roadmap

### Project Status Tracker
- **Stage 1: Navigation and responsive layout** — COMPLETED (Global topbar removed; desktop left sidebar with 9 destinations, restrained active indicator & collapse support; tablet compact 68px icon rail; mobile fixed 5-tab bottom navigation with safe-area insets & accessible More sheet for secondary destinations).
- **Stage 2: Global Search** — COMPLETED (Cross-store search across 8 IndexedDB stores, dedicated `/search` page, SearchOverlay with Cmd/Ctrl+K and `/` triggers, keyboard navigation, result excerpts, and deep links).
- **Stage 3: Quick Capture expansion** — COMPLETED (Unified modal with 8 capture types: Task, Note, Expense, Journal entry, Goal, Person, Wishlist item, Project; type selector, expandable optional fields, existing repositories and validation reused, no DB migration; passes tsc, eslint, and production build).

The stages follow the requested progression, with storage/model work brought forward inside Stage 1 because all future modules depend on it.

### Stage 1 — Module foundation

1. Keep the current shell; activate only routes as their functionality is ready.
2. Add the Projects model/store and optional task-project relationship through an additive IndexedDB migration.
3. Add route-level loading, error, empty, and responsive states using existing shared UI.
4. Plan mobile navigation so every implemented module is discoverable; do not leave a dead More control or inert search field.

**Dependencies:** Existing repository and hooks.  
**Priority:** Projects foundation first; then route wiring for approved modules.

### Stage 2 — Core module features

1. Projects overview and task assignment/progress derived from task completion.
2. Task Today/Upcoming filters, priority, and project metadata while preserving current CRUD and filters.
3. Goals records and progress controls.
4. Finance category/date fields and category/period totals.
5. Journal daily-entry semantics and mood, without converting/dropping existing notes.
6. People and Wishlist records with their observed primary actions.

**Dependencies:** Stage 1 data contracts and migration tests.  
**Priority:** Projects/Tasks first; then Journal, Finance, Goals; People/Wishlist by user value.

### Stage 3 — Advanced features

- Global local Search across implemented stores; debounced query only if needed.
- Task sorting and date boundaries; project status/progress filters.
- Date-range finance summaries and goal progress history only if users need them.
- Cross-module dashboard summaries from real records.
- Defer budgets/accounts (the reference itself says “later”), automation, and configurable dashboard until explicitly prioritized.

**Dependencies:** Real persisted records and stable model fields.  
**Priority:** Search and reliable date filtering first; automation later.

### Stage 4 — Interactions

- Complete create/edit/delete, confirmation, validation, keyboard, and focus workflows for each approved module.
- Add accessible contextual actions that work on both hover and touch.
- Provide non-blocking save confirmation and explicit errors using existing patterns.
- Implement keyboard shortcuts only when their behavior and focus rules are specified.

**Dependencies:** Core screens and stable CRUD APIs.  
**Priority:** Required module workflows before optional shortcuts or context menus.

### Stage 5 — Design system

- Preserve STILL's approved charcoal/olive identity; do not copy the reference's typography or palette wholesale.
- Consolidate repeated CSS responsive blocks incrementally as relevant modules are updated.
- Add consistent tokens/variants for form controls, filters, empty states, and module summaries.
- Maintain existing Dark/Light/AMOLED preferences and ensure new components use theme tokens.

**Dependencies:** Reusable interaction patterns established.  
**Priority:** Token coverage and consistency; visual refinement should not precede working module behavior.

### Stage 6 — Responsiveness and polish

- Validate desktop, tablet, and mobile navigation and content for every implemented route.
- Verify no horizontal overflow, usable touch targets, visible focus, keyboard navigation, and reduced-motion behavior.
- Add migration-preservation tests and focused CRUD/filter tests as modules are introduced.
- Check loading, empty, error, and long-content states; avoid mock data in the live application.

**Dependencies:** Each module's core interactions.  
**Priority:** Every milestone, with final cross-route regression after each stage.

## 11. Recommended first implementation milestone

### Projects foundation + task association

**Deliverable:** A real `/projects` route with local Projects records, an overview matching the reference's summary information, task assignment via optional `projectId`, and progress computed from associated tasks.

**Why first:** Projects are completely missing in STILL, are explicitly connected to Tasks in the reference, and are already summarized on the reference dashboard. This creates a useful reusable relationship before adding dashboard project metrics or more advanced task filters.

**Implementation guardrails:**

- Reuse `life-os-local`; increment its schema version and add a `projects` store without deleting existing stores or records.
- Add optional project association to Tasks; unassigned existing tasks remain unchanged.
- Reuse the repository, `useLocalRecords`, `AppShell`, `ScreenHeader`, state components, and existing modal patterns.
- Keep sample/reference content out of the user's database.
- Define with the user whether project create/edit/archive actions belong in the first increment; the reference page exposes only an overview and does not demonstrate those workflows.

**Acceptance checks:** Upgrade preserves all existing records; create/read/update/delete for approved Project operations; assign/unassign existing tasks; progress reflects completion; empty/loading/error states; dashboard uses only real projects; desktop/tablet/mobile layouts have no overflow.

## 12. Evidence limitations

- The reference's private source, database schema, network behavior, and server-side authorization could not be inspected.
- Several apparent create/update controls did not respond in browser probes. Destructive controls were not clicked, and People's Talked today action was not exercised because it could mutate sample data.
- Search was verified with one query and returned Tasks and Projects; coverage of every record type is unknown.
- No reference empty/error state or edit/detail route was reachable with the seeded dataset and visible navigation.
- No STILL application source or user data was modified during this audit. Previous project validation recorded in session history passed the production build and ESLint; this documentation-only audit did not rerun them.

