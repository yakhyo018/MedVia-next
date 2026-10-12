# Status

Where the frontend stands, what comes next, and how we work. A new session reads this first.
Update it whenever a milestone closes.

_Last updated: 2026-10-12 — **F0 closed: approved by the user, merged into `develop` and pushed.
F1 in progress on `feature/f1-doctors`: the doctors list (`/doctors`) is built and checked in the
browser, not committed — waiting for the user's check.**_

## The project

MedVia-next is the web client of MedVia (`~/Desktop/MedVia`, NestJS GraphQL API). The backend is
complete: M0–M10 + AI-1 + AI-2 merged on its `develop` (Postman 470 requests / 837 assertions after the 2026-10-12 slim-down, Jest 239). Demo data: 15 clinics, 40 doctors, 50 patients.
Structure and code style come from `~/Desktop/nestar-client` (package `nestar-next`, read-only);
the look from `~/Desktop/MedVia-design`. Sample patient personas: Feride Karimova, Yahyo Choriyev.

## Milestones

| # | Milestone | Status |
| --- | --- | --- |
| F0 | Skeleton — Next + MUI theme, 5 languages, Apollo + refresh, layouts, login/signup, alerts | done 2026-10-12 |
| **F1** | **Public pages — home, doctors list (first), clinics (search, filters, Recommended), clinic / doctor / treatment pages** | **next** |
| F2 | Booking — slots → hold → questionnaire + consents → My Bookings | |
| F3 | Chat + notifications — socket `/live`, bell, translations | |
| F4 | MyPage — reviews, follows, settings, "who saw my medical data" | |
| F5 | Clinic dashboard — schedule, requests, treatments, doctors | |
| F6 | Community + CS — posts, FAQ, inquiries | |
| F7 | Admin — dashboard (one GraphQL request), moderation, audit | |
| F8 | Assistant UI — chat panel, cards, Confirm button | |
| F9 | Deploy — `medvia.uz` + `api.medvia.uz`, backend `develop` → `main` | |

## F0 — what was built (2026-10-12)

- Next 14.2.35 pages router on :4000, MUI 5 theme from `scss/MaterialTheme/tokens.ts`, five
  locales (`en` default, `/ru`, `/uz`, `/kk`, `/ko`), 117 keys each.
- Auth: memory-only access token, `restoreSession()` on load, refresh-and-retry in the Apollo
  error link, one refresh at a time (shared promise + Web Lock), cross-tab login/logout.
- Layouts Home / Basic / Full, `Top` (menu, language menu, user menu, mobile drawer), `Footer`.
- Pages: `/` (hero + search box → `/clinics?…`, F1), `/account/join` (log in + patient sign up),
  `/_dev/ui` (every alert, chip, button, field; 404 in production).
- Logo: heart + pulse (L4, chosen by the user) — `Logo.tsx`, `public/img/logo/logo-mark.svg`, favicon.
- Hero: `public/img/hero.jpg` from `MedVia-design/landing-with-photos` + animated sample chat card
  (`HeroChat.tsx`). Login/signup panels: Unsplash, hot-linked (`IMAGES` in `libs/config.ts`).
- Mobile (as drawn in the "MedVia Mobile" design canvas, approved by the user): hero photo +
  compact chat card, labelled search button, language bottom sheet + a Language row in the
  drawer, teal welcome card above the log in / sign up form.
- Motion: `scss/motion.scss` (entrances, hover lift, header shadow, reduced-motion off switch).
- Checked in the browser: signup → name in header; reload → still signed in; revoked access
  token → `getMyProfile` refreshes and retries; wrong password alert; logout in one tab → the
  other tab turns guest; RU locale; 1440 px, 800 px and 375 px mobile (drawer).
- Not in F0: Google sign-in (needs `GOOGLE_CLIENT_ID`), clinic signup (F5).
- Test account made during the check: `f0.feride@medvia.test` (local DB only).

## F1 — doctors list (2026-10-12, in progress)

- `/doctors`, in the menu before Clinics: `getDoctors` (public), 8 per page, name / specialty /
  language filters, sort pills (Recommended = `doctorScore` default, Rating, Likes, Views, Recent),
  MUI pagination, skeletons, empty and error states. Filters live in the URL (`?text=&specialty=
  &lang=&sort=&page=`), so back / forward and shared links work; unknown values are ignored.
- Desktop 4 columns (3 / 2 on narrower windows), mobile one column with photo left.
- Found while building: GraphQL takes `Direction` by name (`"DESC"`), not the backend's number.
- Not yet: the "Any clinic" filter (with the clinics page), liking from the card, doctor detail.

## The F0 plan (approved, kept for reference)

Branch `feature/f0-skeleton` from `develop`.

1. **Project files.** `npm init` with scripts `dev` (`next dev -p 4000`), `build`, `start`,
   `typecheck` (`tsc --noEmit`), `lint:check` (`next lint`), `lint:fix`. `.prettierrc`,
   `tsconfig.json`, `global.d.ts` copied from nestar-next. `next.config.js` with nestar-next's env
   names `REACT_APP_API_URL` (`http://localhost:3000`), `REACT_APP_API_GRAPHQL_URL`
   (`http://localhost:3000/graphql`), `REACT_APP_API_WS` (`http://localhost:3000`).
   `next-i18next.config.js`: locales `en, ru, uz, kk, ko`, default `en`, `localeDetection: false`.
   `.env.example`, `.gitignore` (already here).
2. **Packages (only these in F0):** `next@14`, `react@18.2`, `react-dom@18.2`, `typescript`,
   `@types/react`, `@types/node`, `@mui/material@5`, `@mui/icons-material@5`, `@emotion/react`,
   `@emotion/styled`, `sass`, `@apollo/client@3`, `graphql`, `next-i18next`, `i18next`,
   `react-i18next`, `sweetalert2`, `eslint` + `eslint-config-next@14`, `prettier`.
3. **Apollo + auth.** `apollo/client.ts` (nestar-next's `initializeApollo` / `useApollo`):
   `authLink` reads the in-memory token; `HttpLink` with `credentials: 'include'`; `errorLink`
   refreshes once on `UNAUTHENTICATED` and retries. `apollo/store.ts`: `userVar` in the MedVia
   `Member` shape. `apollo/user/mutation.ts`: `LOGIN`, `SIGN_UP`, `LOGOUT`, `REFRESH_TOKEN`;
   `apollo/user/query.ts`: `GET_MY_PROFILE`. `libs/auth/index.ts`: `logIn(email, password)`,
   `signUp(...)`, `restoreSession()`, `updateUserInfo()` (via `getMyProfile`), `logOut()`
   (mutation + cross-tab signal). Check the exact field names in the backend DTOs first
   (`~/Desktop/MedVia/apps/medvia-api/src/libs/dto/member/*`, `member.resolver.ts`).
4. **Ported logic.** `libs/sweetAlert.ts` (nestar-next functions, MedVia look, + 
   `sweetDangerConfirmAlert`), `libs/hooks/useDeviceDetect.ts`, `libs/utils.ts` (`formatKrw`,
   `seoulTime`), `libs/config.ts` (`Messages` mirroring the backend), `libs/types/common.ts`,
   `libs/types/member/*`, `libs/enums/member.enum.ts`, `libs/enums/common.enum.ts` (`Language`).
5. **UI.** `scss/MaterialTheme/tokens.ts` + theme, `scss/_tokens.scss`, `scss/app.scss`,
   `scss/pc/main.scss`, `scss/mobile/main.scss`, alert styles. Layouts `withLayoutHome`,
   `withLayoutBasic`, `withLayoutFull`; `Top` (logo, menu, language switch, login / profile),
   `Footer`; `StatusChip`. Pages: `_app.tsx` (calls `restoreSession()`), `_document.tsx`
   (Plus Jakarta Sans), `index.tsx` (simple hero + search box), `account/join.tsx` (login +
   signup), `_dev/ui.tsx` (every alert / toast / chip / button variant; development only).
   Locales `public/locales/<lang>/common.json` for the five languages.
6. **Check.** `typecheck`, `lint:check`, `build`; in the browser with the API on :3000 and the app
   on :4000: sign up → name in Top; reload → still signed in (refresh cookie); token expiry →
   the request refreshes by itself; logout → the second tab logs out too; five languages;
   `/_dev/ui` vs the mockup; desktop + mobile screenshots. `rg "nestar|Nestar|property|Property"`
   empty. Then explain + LEARN.md + DECISIONS.md, the user checks, merge into `develop`.

## How we work

The full rules are in `CLAUDE.md`. The ones a new session must not miss:

1. **Answer in Uzbek, short and decisive.** Code, comments and these docs stay in English.
2. Plan → wait for yes → build → verify in the browser → explain (problem → alternatives → code →
   interview Q&A) → LEARN.md → the user checks → merge.
3. Same structure and code style as nestar-next; the four deliberate differences are in CLAUDE.md.
4. Never touch `~/Desktop/nestar-client`, `~/Desktop/Nestar` or `~/Desktop/MedVia-design`.
5. Commit hygiene: stage by name, read the staged diff, run the secret scan, no Claude attribution.

## How to run

```bash
cd ~/Desktop/MedVia && npm run start:dev          # API on :3000 (Atlas + local Redis)
cd ~/Desktop/MedVia && npm run start:dev:batch    # batch on :3001 (only for batch features)
cd ~/Desktop/MedVia-next && yarn dev                # app on :4000 (yarn, not npm)
```
Never run `yarn build` while `yarn dev` is running — both write `.next/`, and the dev
server breaks (fix: stop it, `rm -rf .next`, start again).

Demo accounts (backend seed): `feride@`, `yahyo@`, `clinic01@`, `doctor01@`, `admin@seed.medvia.test`
with `SEED_PASSWORD` from `~/Desktop/MedVia/.env`.

## Open items

- Google sign-in needs `GOOGLE_CLIENT_ID` (backend open item).
- Before deploy (F9): copy the Unsplash photos into `public/img/` and re-check `yarn audit` for
  Next 14 (current advisories are mostly App Router / middleware / `next/image`).
- Seed data (backend): every seeded doctor speaks only KO / EN, so the RU / UZ / KK language
  filter finds nobody; and ~190 test doctors from Postman runs ("Assistant Test Clinic …") sit in
  the dev DB. Both are backend seed / cleanup tasks.
- `hero.jpg` came from the design folder without a recorded source — confirm its licence before a
  public deploy. `MedVia-design/landing-with-photos/img/` also has treatment and clinic photos for F1.
