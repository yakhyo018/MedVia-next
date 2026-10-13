# Status

Where the frontend stands, what comes next, and how we work. A new session reads this first.
Update it whenever a milestone closes.

_Last updated: 2026-10-13 — **F2 closed: approved by the user, `feature/f2-booking` merged into
`develop` and pushed. Next: F3 (chat + notifications) — start with the screen list review.**_

## The project

MedVia-next is the web client of MedVia (`~/Desktop/MedVia`, NestJS GraphQL API). The backend is
complete: M0–M10 + AI-1 + AI-2 merged on its `develop` (Postman 470 requests / 837 assertions after the 2026-10-12 slim-down, Jest 239). Demo data: 15 clinics, 40 doctors, 50 patients.
Structure and code style come from `~/Desktop/nestar-client` (package `nestar-next`, read-only);
the look from `~/Desktop/MedVia-design`. Sample patient personas: Feride Karimova, Yahyo Choriyev.

## Milestones

| # | Milestone | Status |
| --- | --- | --- |
| F0 | Skeleton — Next + MUI theme, 5 languages, Apollo + refresh, layouts, login/signup, alerts | done 2026-10-12 |
| F1 | Public pages — home bands, clinics list, doctors list, doctor page, clinic page | done 2026-10-13 |
| F2 | Booking — slots → hold → questionnaire + consents → My Bookings | done 2026-10-13 |
| **F3** | **Chat + notifications — socket `/live`, bell, translations** | **next** |
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

## F2 — booking (2026-10-13, done)

- Screen list approved (option (a): My Bookings as its own page until MyPage in F4). Mobile drawn
  first on the MedVia Mobile canvas ("F2 — booking": Questionnaire, Review & consent, Request
  sent, My Bookings).
- Clinic page booking card: 14-day Seoul date strip, free times from `getAvailableSlots`
  (`useAvailableSlots`; "any available doctor" asks each performing doctor and merges by time),
  interpreter switch when the clinic has one for the site language, Request booking →
  `holdSlots` (patients only; guests get the login prompt) → `/booking`.
- `/booking` (steps 2–4 in one page): questionnaire per specialty (`libs/questionnaire.ts`,
  question sent in English, answer as written), review + consents (SHARE_DATA and BOOKING_TERMS
  required, AI_SUMMARY optional), `createBooking` → "Request sent" with `respondDeadline`.
  The URL carries only ids, start, hold end and interpreter; answers stay in memory. A
  countdown from `holdExpiresAt` sends the patient back to the clinic page when it ends.
- `/mypage/bookings`: Upcoming / Past / Cancelled (`?tab=`), cancel a request or a confirmed
  booking (not within 24 h, as the API rules), "Book again".
- The clinic side (confirm / decline / complete in a UI) stays in F5 — the user chose to follow
  the plan (2026-10-13). Until then a clinic answers with `updateBookingStatus` in the API's
  GraphQL playground (AGENT token).
- Cut (no API or later milestone): AI summary preview (the API writes it after sending, for the
  doctor), photos, partner-offers consent, reschedule, visit-day queue, chat (F3), reviews (F4).
- Checked: hold → questionnaire (required errors) → consents (required error) → booking
  `#MV-2026-376929` → My Bookings → cancel → Cancelled tab; mobile sheet, /booking fixed actions,
  My Bookings tabs; `build:check` 57 pages. The test booking was cancelled.

## F1 — home: the last three bands (2026-10-13, waiting for the user's check)

- Mobile drawn first on the MedVia Mobile canvas ("Home · reviews, patients, community"), approved.
- **Verified reviews** (`HomeReviews`): `getReviews({ page: 1, limit: 6 })`, the shared `ReviewCard`
  cut to four lines; desktop shows three, mobile swipes through six.
- **For international patients** (`PatientServices`): the mockup's "Events and promotions" — the
  API has no events, so two static i18n cards (interpreters → `/clinics?interpreter=1`, prices →
  `/clinics?sort=price`); no invented offers (the user chose static cards).
- **Community board** (`CommunityBoard`): `getArticles` per category (QNA, HEALTH_TIP; the API
  has no "treatment reviews" category), 4 most viewed each; two columns on desktop, tabs on
  mobile; read-only until F6; answers / comments with plural keys.
- Carousels (2026-10-13, user's request — home was too long on a phone): `swiper@11.2.10` added
  (nestar-next's home bands use Swiper; 11 instead of nestar's 8 — current, cleaner module
  imports). `HomeCarousel`: Recommended clinics / doctors 8 each, 4 in view; Verified reviews 9,
  3 in view; MUI arrow buttons outside the row on desktop (hidden at the ends), swipe + dots on a
  phone; no autoplay. The CSS `swipe-row` mixin stays for the clinic page's rows.
- After `yarn add` the running dev server answered `/` with 500 ("getStaticPaths is not a
  function"); touching `pages/index.tsx` made it recompile. Restart `yarn dev` after adding a package.
- `HomeSection.link` is optional now. Checked on desktop (six bands, links, no overflow); the
  mobile checked once the user opened the Browser pane (a hidden pane never hydrates).

## F1 — clinic page `/clinics/detail?id=` (2026-10-13, waiting for the user's check)

- Designs: Web Mockup `ClinicDetail` + Prototype `ClinicDetailDoctor`; mobile drawn first on the
  MedVia Mobile canvas ("F1 — clinic page": Clinic detail + Book sheet) and approved.
- Header (chips, rating, district, languages; Follow · N, ♡, Share = Web Share or copy link),
  photo grid that follows the photo count (1–5; mobile: swipe row with "1 / 5"), About + facts
  (opening hours folded by `openingHours()`, interpreter, doctors count with plurals),
  Treatments and prices (table; cards on mobile), Doctors, Location (OpenStreetMap iframe, no key),
  Verified reviews (`RatingSummary`, `ReviewCard`, Show more), Similar clinics nearby
  (`getNearbyClinics`, `ClinicCard`).
- Booking card (sticky side on desktop, bottom sheet behind a fixed Book bar on mobile): treatment
  and doctor pickers, interpreter, total. Dates / times, Request booking and Chat are disabled
  until F2 / F3.
- `?doctor=` (the doctor page's new "Book at the clinic"): that doctor is preselected, a banner
  "Showing the treatments this doctor performs · Show all doctors", treatments the doctor does not
  perform show "Other doctors" (the seed's doctors perform every treatment of their clinic, so
  this state is not visible with demo data).
- Checked: guest ♡ → login prompt; patient Follow and ♡ update in place and survive a reload
  (undone afterwards); bad id → "Clinic not found"; RU strings. Test patient
  `f1.clinic@medvia.test` (local DB; `npm run clean:test -- --yes` removes it).
- Found while checking: a flex column grew to the doctor strip's width on mobile (page scrolled
  sideways) — `min-width: 0`; scroll-snap rows snapped past the 16 px gutter — `scroll-padding`.
- Dev-only: in the hidden Browser pane, pages with a query (`?id=`) take 20–60 s until
  `router.isReady` (Next dev router + throttled background tab); `/doctors?sort=` behaves the
  same, so it is not this page. Re-check in a visible browser / production build.

## F1 — clinics list + doctor page + home bands (2026-10-12 / 13)

- Menu: Home · Clinics · Doctors. Both lists carry "Clinics N | Doctors M" tabs.
- `/clinics`: sidebar filters (name or treatment, 7 districts, specialty, ₩ range, languages,
  interpreter) applied on Apply; sort Recommended / Rating / Price ↑ / Likes / Views / Newest;
  removable chips; 9 per page; URL keys `text, specialty, district, lang, min, max, interpreter,
  sort, page`; mobile filters in a bottom sheet. The home search now lands here.
- Cards: real photos (seeded from the landing sample), Verified, ♡ (guest → login prompt that
  returns to the page; clinic / doctor accounts refused; the cache updates in place).
- `/doctors/detail?id=`: header with stats, Follow + ♡, About, Education and career, the doctor's
  treatments, reviews with the rating summary and "Show more"; clinic box in the sidebar.
- Fixes found while checking: the Log in → Sign up tab dropped `?referrer=`; queries sent before
  the session was restored showed a guest's meLiked / meFollowed — active queries now refetch
  once the session is back.
- Home bands in the mockup's order: Recommended clinics → Trending treatments → Recommended doctors.
  The two "Recommended" bands follow nestar-next's TopProperties / TopAgents: the public list,
  `limit: 4`, sorted by the batch's `clinicScore` / `doctorScore` (Bayes rating 60 % + recent
  visits 25 % + followers 15 %) — not by raw rating, where one 5-star review tops forty 4.8 ones.
- Home "Trending treatments": 4 cards from the backend's `getTrendingTreatments` (most-booked
  treatment names of the last 30 days, photo by specialty from the landing sample); a card opens
  `/clinics?treatment=<name>` — the exact filter, so "4 clinics" on the card means 4 in the list.
- Next: the clinic page (`/clinics/detail`) — cards and the doctor page already link to it.

## F1 — doctors list (2026-10-12)

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
`yarn build:check` is safe beside `yarn dev` (it writes `.next-check/`). After `yarn add`, restart
`yarn dev`.

Demo accounts (backend seed): `feride@`, `yahyo@`, `clinic01@`, `doctor01@`, `admin@seed.medvia.test`
with `SEED_PASSWORD` from `~/Desktop/MedVia/.env`.

## Open items

- **Before deploy (F9) — richer demo data (the user's request, 2026-10-13).** Today the backend
  seed is templated: 15 clinics share 8 distinct photos, one description pattern and the same
  hours (Mon–Sat 09–19); 40 doctors have no photo, 4 bios and the same 3-line career. Before
  deploy, in the backend repo (`feature/seed-variety`): photos for every clinic and doctor,
  own descriptions, varied hours, bios and careers; three clinic names and the doctors /
  patients made realistic. Rules agreed: photos only from licensed sources (Unsplash / Pexels
  or Google Images filtered to Creative Commons, source recorded) — not arbitrary Google
  results; names *realistic but fictional* — never a real Seoul clinic or a real doctor (the
  site shows reviews and ratings for them). Until then the current seed is enough.

- Google sign-in needs `GOOGLE_CLIENT_ID` (backend open item).
- Before deploy (F9): copy the Unsplash photos into `public/img/` and re-check `yarn audit` for
  Next 14 (current advisories are mostly App Router / middleware / `next/image`).
- `yarn build:check` builds into `.next-check/` while `yarn dev` runs (F1 passed: 47 static
  pages). Run it before every merge; the real `yarn build` is for deploy.
- A test patient from the browser checks, `f1.feride@medvia.test`, stays until the backend's
  `npm run clean:test -- --yes` (or the next `npm run test:api`) removes it.
- The demo seed was rebuilt several times on 2026-10-12/13 (`--reset`): clinic and doctor ids
  changed; old links with ids no longer resolve.
- `hero.jpg` came from the design folder without a recorded source — confirm its licence before a
  public deploy. `MedVia-design/landing-with-photos/img/` also has treatment and clinic photos for F1.
