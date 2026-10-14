# Decisions

Decision / Why / Risks / Alternatives — one table per milestone.

## F-1 — Frontend foundations (2026-10-12, before F0)

| Decision | Why | Risks | Alternatives |
| --- | --- | --- | --- |
| A separate repo `~/Desktop/MedVia-next`, not `apps/` in the backend monorepo. | Same split as Nestar (API repo + client repo); separate deploys. | Shared enums are copied, not imported. | `apps/medvia-web` in the monorepo. |
| Structure, code style and reusable logic from nestar-next (`~/Desktop/nestar-client`); look from MedVia-design. | The user's own pattern: familiar, consistent across projects. | Inherits nestar-next's older majors. | A fresh App Router structure. |
| Same majors as nestar-next: Next 14 pages router, React 18.2, MUI 5, Apollo 3, next-i18next; yarn 1 (switched from npm on 2026-10-12, the user's choice — nestar-next uses yarn). | Logic ports one-to-one. | An upgrade later. | Next 15 App Router, MUI 6. |
| Four deliberate style differences: no `defaultProps`, no needless `any` / `@ts-ignore`, `===`, meaningful `Messages` names. | React 18.3 deprecates `defaultProps`; types are the point of TypeScript. | — | Copy nestar-next exactly. |
| Access token in memory; refresh by the backend's httpOnly cookie; profile from `getMyProfile`. | XSS cannot read memory-only tokens across reloads; the JWT has no profile by design (backend M1). | A reload costs one refresh request. | nestar-next's `localStorage` + `jwt-decode`. |
| socket.io-client on `/live`; REST uploads; no `apollo-upload-client`, no `WebSocketLink`. | The backend's realtime and upload design (M7, M8c, M2). | — | nestar-next's raw WebSocket. |
| Locales en / ru / uz / kk / ko. | Patients RU/UZ/KK, clinics KO. | Five sets of strings to keep. | nestar-next's en / kr / ru. |
| sweetalert2 kept with nestar-next's function names, styled from MedVia-design tokens (`Swal.mixin`, `customClass`); one token source for MUI, SCSS and alerts. | Same calls everywhere; the look matches the mockup. | Custom CSS to maintain. | MUI dialogs only; default SweetAlert look. |
| Hand-written types (nestar-next style), no graphql-codegen. | Consistency with nestar-next. | Drift from the backend DTOs — checked per milestone. | `@graphql-codegen/cli`. |

## F0 — Skeleton (2026-10-12)

| Decision | Why | Risks | Alternatives |
| --- | --- | --- | --- |
| Refresh calls share one promise per tab and a Web Lock (`navigator.locks`) across tabs. | The API rotates refresh tokens and treats a late replay as theft. | Very old browsers lack Web Locks — then tabs may race; the API's 10 s grace covers most of it. | BroadcastChannel leader election; refresh only in one tab. |
| `errorLink` refreshes once on `UNAUTHENTICATED` and retries; no proactive timer. | One code path; no timers in background tabs. | The first request after 15 min costs an extra round trip. | Refresh on a timer before `exp`; `apollo-link-token-refresh` (needs to decode the token). |
| `medvia:session` hint in localStorage. | Guests send no refresh request on every page. | Clearing storage makes a still-valid cookie look logged out until the next login. | Always call refresh on load. |
| No global error alert in the Apollo link (nestar-next showed one for every error). | Each handler shows its own `sweetMixinErrorAlert`; two alerts for one error was noise. | A handler that forgets `try/catch` shows nothing. | Global alert with an opt-out context flag. |
| i18n keys are English sentences; `keySeparator` / `nsSeparator` off. | Readable code, server messages translate as keys. | Changing an English text changes the key in five files. | Nested keys (`auth.login.title`). |
| Design tokens: `tokens.ts` → MUI theme + CSS variables on `:root` → SCSS → SweetAlert. | One place to change a colour. | No Sass colour functions on tokens. | Duplicate values in `_tokens.scss`. |
| Motion in CSS only, with `prefers-reduced-motion`. | Entrances and hovers need no JS; no package to justify. | Complex sequenced animation later would need a library. | `framer-motion`. |
| Logo: a heart with a pulse line (option L4 of six the user compared), inline SVG in `Logo.tsx`, `logo-mark.svg`, favicon; the heart beats on hover. | Chosen by the user; SVG stays sharp and has a white variant. | — | Cross tile (mockup), chat bubble, map pin, monogram, leaves. |
| Hero photo = `MedVia-design/landing-with-photos/img/hero.jpg` (the user's approved landing sample), copied to `public/img/`, with the sample's chat card animated on top. Login/signup panels: Unsplash (free licence), hot-linked with credit. | The user picked the sample over eight Unsplash candidates. | The sample photo's source/licence is not recorded in MedVia-design — confirm before a public deploy; Unsplash images depend on their CDN until copied (F9). | Unsplash hero photos. |
| Login and patient signup only; Google button and clinic signup left out of F0. | Google needs `GOOGLE_CLIENT_ID`; clinic signup belongs to F5 (`signupClinic`). | The mockup's two extra controls are missing for now. | Disabled placeholders. |
| Next 14.2.35 kept despite `yarn audit` advisories. | Same major as nestar-next (F-1); most advisories concern App Router, middleware, `next/image` — unused here. | Must be re-checked before deploy (F9). | Next 15/16 now. |

## F1 — Public pages (2026-10-12, in progress)

_State 2026-10-13: built — home bands (Recommended clinics, Trending treatments, Recommended
doctors), `/clinics`, `/doctors`, `/doctors/detail`; left — `/clinics/detail`, LEARN.md F1, the
user's check, the merge. Details and the clinic-page plan: STATUS.md → "Next step"._

| Decision | Why | Risks | Alternatives |
| --- | --- | --- | --- |
| Filters and sort in the URL (readable keys), validated on read. | Back / forward and shared links keep the list; the query is user input. | Long URLs with many filters. | Component state only; one JSON `?input=` (nestar-next). |
| Clinic filters apply on "Apply"; the doctor name searches on "Search". | One request per decision, not per keystroke or tick. | One click more. | Live filtering with a debounce. |
| Likes and follows update the Apollo cache (`cache.modify`) from the mutation's answer. | Instant, no refetch of the page. | The cache shape must match the API types (`_id` keys). | `refetchQueries`. |
| After the session is restored, active queries refetch once. | The first queries leave as a guest, so viewer flags came back empty. | Signed-in pages send their first queries twice. | Hold every query until the session is ready (slower first paint for everyone). |
| Seed clinics use the landing sample's photos; seed doctors get a career with generic places. | Real-looking cards and doctor pages; fictional doctors are never tied to real institutions. | Four photos repeat across 15 clinics. | Unsplash per clinic; no career section. |
| Landing "Recommended clinics / doctors" reuse `getClinics` / `getDoctors` with `limit: 4` and the batch score (nestar-next's TopProperties pattern); titled "Recommended", not "Highly rated". | No new API; the score already weighs a rating by its reviews. The score also counts visits and followers, so "Highly rated" would promise something it does not sort by. | — | Sort by raw rating (one review wins); a new "top rated" query. |


## F4 — MyPage (2026-10-14)

| Decision | Why | Risks | Alternatives |
| --- | --- | --- | --- |
| One page per section (`/mypage/favorites`, `/mypage/reviews`, …) inside a shared `MyPageFrame` (band + side menu on a computer, back link on a phone). | My Bookings and Chat were already their own routes; each section has its own title, URL and code-split bundle. The frame also holds the login guard once. | Every section re-mounts the frame on navigation. | nestar-next's single `/mypage?category=` page switching components. |
| "Medical data & consent" shows only the AI consent and the access log — no medical profile form. | The API keeps no medical profile: answers live in each booking's questionnaire; a form that saves nowhere would lie. | The mockup's blood type / allergies blocks are cut. | Add a `medicalProfile` to the backend first (user chose (a), 2026-10-14). |
| Review tabs (Published / In review) filter the loaded list on the client. | `getMyReviews` has no status filter; a patient writes a handful. | Beyond 50 reviews the tabs would miss some. | A status filter in the API. |
| "Show more" lists stop at 50 (`LIST_MAX`); the access log pages with `Pagination`. | Every list inquiry has `@Max(50)`; growing `limit` past it fails validation. An audit log must stay fully reachable. | Recently visited / favorites show the latest 50 only. | `fetchMore` with page merging in the cache. |
| Favorites queries leave out `meLiked`; unliked cards hide by a local id list, then refetch. | The API returns `meLiked: null` there; writing it would overwrite `true` on the same Clinic / Doctor in the shared cache. | A failed unlike leaves the card hidden until reload. | Ask the API to fill `meLiked` on favorites. |
| Images upload over REST with `fetch` + `FormData` (`useUpload`), refresh-and-retry once on 401. | The API's upload is REST; no `apollo-upload-client` (banned). | Two auth paths to keep in step. | GraphQL multipart upload. |
| `changePassword` lives in `libs/auth` and swaps the access token. | The API revokes every access token, this one too, and returns a fresh one; only the auth module may hold the token. | — | Call the mutation from the page and refresh afterwards (one failed request first). |
| A profile with an emptied phone keeps the old phone. | The API validates `memberPhone` against the pattern, so `''` is refused. | The patient cannot remove a phone. | An explicit "remove phone" in the API. |

## F5 — Clinic Dashboard + Doctor Panel (2026-10-14)

| Decision | Why | Risks | Alternatives |
| --- | --- | --- | --- |
| One branch for all of F5 (the user's choice), Doctor Panel included. | The doctor account had no area at all; the clinic and doctor share the review-reply UI. | A large review for the user. | F5a / F5b with a merge after each. |
| `WorkspaceFrame` serves My Page, the Clinic Dashboard and the Doctor Panel; each area is a thin wrapper (home link, allowed member type, side menu, phone tabs, notice). | One guard and one layout for every signed-in area; F7 Admin can reuse it. | A change to the frame touches three areas. | Three copies of the frame. |
| Routes `/dashboard/*` (clinic) and `/doctor-panel/*`. | `/clinic` and `/doctor` would sit next to the public `/clinics` and `/doctors` and read like typos. | — | `/clinic/*`; nestar-next's `?category=` single page. |
| `ChatConversation` takes `side`; the clinic writes Korean only (no language picker). | The API fixes a clinic message to Korean (`senderLang`); the same room serves both sides. | — | A second chat component for the clinic. |
| The clinic cannot start a chat; "Chat with patient" opens the patient's room if one exists, else says so. | `openRoom` is patient-only in the API. | A clinic with a question waits for the patient to write. | An API change to let a clinic open a room. |
| Booking moves follow the API's table: Approve / Decline (reason) for requests, Cancel (reason) before the visit, Completed / No-show after it starts. | The buttons never offer a move the API would refuse. | — | Every button always, with server errors. |
| A verified clinic's name, signboard name, district and address are read-only. | The API refuses to change them after verification (`CLINIC_FIELDS_LOCKED`). | A real move needs support. | Editable fields that fail on save. |
| Schedule: a week grid on a computer, a day list on a phone; open and blocked slots are picked, then blocked / opened in one call. | `setSlotsBlocked` takes many ids; picking matches how a clinic blocks an afternoon. | Weeks with many doctors make tall cells (the doctor filter helps). | Click-to-toggle each slot (one request per slot). |
| Notification links follow the reader: a clinic's lead into `/dashboard`, a patient's into `/mypage`. | The same types (new message, cancelled) reach both sides. | — | Separate notification texts per side. |
| Cut: change the assigned doctor, average response time, visit-day queue, map pin editing, a "New review" notification switch, Q&A / Articles in the Doctor Panel (F6). | No API (or a later milestone). | — | — |
