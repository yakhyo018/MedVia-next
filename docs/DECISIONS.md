# Decisions

Decision / Why / Risks / Alternatives — one table per milestone.

## F-1 — Frontend foundations (2026-10-12, before F0)

| Decision | Why | Risks | Alternatives |
| --- | --- | --- | --- |
| A separate repo `~/Desktop/MedVia-next`, not `apps/` in the backend monorepo. | Same split as Nestar (API repo + client repo); separate deploys. | Shared enums are copied, not imported. | `apps/medvia-web` in the monorepo. |
| Structure, code style and reusable logic from nestar-next (`~/Desktop/nestar-client`); look from MedVia-design. | The user's own pattern: familiar, consistent across projects. | Inherits nestar-next's older majors. | A fresh App Router structure. |
| Same majors as nestar-next: Next 14 pages router, React 18.2, MUI 5, Apollo 3, next-i18next; npm. | Logic ports one-to-one. | An upgrade later. | Next 15 App Router, MUI 6. |
| Four deliberate style differences: no `defaultProps`, no needless `any` / `@ts-ignore`, `===`, meaningful `Messages` names. | React 18.3 deprecates `defaultProps`; types are the point of TypeScript. | — | Copy nestar-next exactly. |
| Access token in memory; refresh by the backend's httpOnly cookie; profile from `getMyProfile`. | XSS cannot read memory-only tokens across reloads; the JWT has no profile by design (backend M1). | A reload costs one refresh request. | nestar-next's `localStorage` + `jwt-decode`. |
| socket.io-client on `/live`; REST uploads; no `apollo-upload-client`, no `WebSocketLink`. | The backend's realtime and upload design (M7, M8c, M2). | — | nestar-next's raw WebSocket. |
| Locales en / ru / uz / kk / ko. | Patients RU/UZ/KK, clinics KO. | Five sets of strings to keep. | nestar-next's en / kr / ru. |
| sweetalert2 kept with nestar-next's function names, styled from MedVia-design tokens (`Swal.mixin`, `customClass`); one token source for MUI, SCSS and alerts. | Same calls everywhere; the look matches the mockup. | Custom CSS to maintain. | MUI dialogs only; default SweetAlert look. |
| Hand-written types (nestar-next style), no graphql-codegen. | Consistency with nestar-next. | Drift from the backend DTOs — checked per milestone. | `@graphql-codegen/cli`. |
