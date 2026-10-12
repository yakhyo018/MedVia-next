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
