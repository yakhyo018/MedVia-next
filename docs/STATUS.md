# Status

Where the frontend stands, what comes next, and how we work. A new session reads this first.
Update it whenever a milestone closes.

_Last updated: 2026-10-15 — **F9 (Deploy) in progress: code ready (backend `feature/seed-variety`,
`feature/demo-mode`, `feature/docker`; frontend `feature/f9-deploy`). Next: merge both repos
`develop` → `main`, then the server by `~/Desktop/MedVia/deploy/README.md`.**_

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
| F3 | Chat + notifications — socket `/live`, bell, translations | done 2026-10-13 |
| F4 | MyPage — reviews, follows, settings, "who saw my medical data" | done 2026-10-14 |
| F5 | Clinic dashboard — schedule, requests, treatments, doctors (+ Doctor Panel) | done 2026-10-14 |
| F6 | Community + CS — posts, FAQ, inquiries | done 2026-10-14 |
| F7 | Admin — dashboard (one GraphQL request), moderation, audit | done 2026-10-15 |
| F8 | Assistant UI — chat panel, cards, Confirm button | done 2026-10-15 |
| **F9** | **Deploy — `medvia.tech` + `api.medvia.tech`, Docker Compose, both repos `develop` → `main`** | **in progress** |

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

## F9 — Deploy (2026-10-15, in progress)

- The user's choices: domain **medvia.tech** (`api.medvia.tech`), **Docker Compose** (after the
  PM2 vs Compose comparison), **DEMO_MODE** (synthetic data, OpenRouter in production), seed
  enriched before deploy, 8 clinics × 3 doctors, 50 patients; deploy today.
- Backend: seed variety (names checked against real clinics, hand-written clinics and doctors,
  hours, licensed photos — see the backend STATUS), `DEMO_MODE`, `Dockerfile` +
  `deploy/` (compose, nginx, certbot scripts, runbook `deploy/README.md`).
- Frontend: `Dockerfile` (build args `REACT_APP_*` = `https://api.medvia.tech…`, `i18n:check`
  before `next build`, `next start` on :4000 as `node`).
- Photos: **generated** (2026-10-16, the user's decision after adding $5 of Hugging Face credits;
  replaces the stock photos of 2026-10-15) — FLUX.1 Krea [dev] through HF Inference Providers.
  Backend seed: 32 clinic rooms + 24 doctor portraits (`npm run photos:generate`). Frontend: hero,
  login (Bukchon roofs + skyline), signup (Seoul at dusk), 4 treatment cards
  (`yarn images:generate`, prompts in `docs/IMAGES.md`), all local — nothing hot-linked, no credit
  line. fal's safety checker blacked out two harmless images; both scripts now retry with the next
  seed.
- Health-tip photos (the user's request, 2026-10-16; backend `feature/article-images`): a tip can
  carry 2 photos, the first is the cover. Write page: a Photos block for tips only (72 px tiles,
  dashed add tile, as in WriteArticle), upload target `article`; Health tips board: two-column
  cover cards (CommunityNews); detail: photos after the first paragraph (ArticleDetail). Checked in
  the browser (list + detail, 1440 px) and on the local API (doctor upload + post, limits, 403 for
  a patient). The write page itself was not opened as a doctor here — the local seed password
  could not be read in this session; worth a look when you log in as `doctor01@`.
- The sign-up form's Full name field lost its sample name ("Feride Karimova").
- Google sign-in (the user's request): "Continue with Google" on Log in / Sign up for patients
  (`GoogleButton`, `googleLogIn`, `GOOGLE_LOGIN`); hidden until `REACT_APP_GOOGLE_CLIENT_ID` is set —
  the OAuth client is created by the user (runbook §3). Not tested end to end without it.
- Not checked here: Docker is not installed on the laptop — the images are first built on the
  server. Next 14 `yarn audit` still to re-check.

## F8 — Assistant UI (2026-10-15, done)

- No mockup; the user chose: build from the chat look, floating button + drawer, clinic id via
  the cards / `getDoctor`.
- `AssistantLauncher` (in `_app`; patients and guests; hidden on `/booking`, chat, admin,
  login; floating animation), `AssistantPanel` (session restore, consent lock, suggestions,
  clinic cards, time options, proposal card with countdown → `confirmAssistantHold` →
  `/booking`, new conversation, full / error states), `AssistantText` (bold + lists as React
  elements). GraphQL: `GET_MY_ASSISTANT_SESSION`, `GET_DOCTOR_CLINIC`, `SEND_ASSISTANT_MESSAGE`,
  `CONFIRM_ASSISTANT_HOLD`, `CLOSE_ASSISTANT_SESSION`.
- i18n: `fallbackLng: false` (pages no longer ship the English file) + `yarn i18n:check`.
- Also: `ReviewInvite` on clinic and doctor pages ("Write a review" after a completed visit).
- Checked with `feride@seed`: a real conversation (2 model calls), Confirm → `/booking` (the hold
  was left to expire, no booking made). Feride's AI consent is now on.

## F7 — Admin panel (2026-10-15, done)

- Screen list approved (13 mockups + an Audit log page); the user chose: phone = simple
  adaptation (drawer + scrolling tables, no Mobile-canvas artboards), one branch, Audit as its
  own page.
- `withLayoutAdmin` (side menu, top bar with breadcrumb / search / bell / admin menu; the admin
  guard), `AdminMenu`, `AdminPills`, `AdminPager`, `AdminStatCard`, `AdminClinicList`,
  `useUrlQuery`, `apollo/admin/query.ts` + `mutation.ts`, `libs/types/admin/admin.ts`, enums
  `admin.enum.ts` + `batch.enum.ts`. Header: "Admin" → `/_admin` for admin accounts.
- Pages: `/_admin` (one request: booking cards, 14-day chart, languages, batch runs + queue,
  recent decisions), `/_admin/users` (+ `/detail?id=`: account, activity, bookings, access log),
  `/_admin/clinics` (verification) + `/all` (suspend / restore) + `/review?id=` (checklist,
  decision), `/_admin/doctors`, `/_admin/treatments`, `/_admin/bookings` (monitor),
  `/_admin/reviews`, `/_admin/community` (+ `/reports`), `/_admin/cs` (inquiries),
  `/_admin/cs/notices` (notices & FAQ editor, EN + 4 translations), `/_admin/audit`.
- i18n: admin texts in a new `admin.json` namespace (291 keys; ru 305 with plurals), loaded
  only by admin pages — in `common.json` they pushed every page over Next's 128 kB data warning.
  Admin pages still warn (138–162 kB).
- Cut (no API): Export CSV, notify a user, avg. response, booking date range, inquiry templates
  / "Ask clinic" / translation, specialty filters, doctors per clinic, 30-day chart.
- Test data touched while checking (local DB): `f4.patient@medvia.test` blocked → unblocked;
  a notice draft created → removed; **`f5.clinic@medvia.test` (F5 Test Smile Clinic) was sent
  "Request changes" by mistake** (the old note was pre-filled — now fixed); it returns to
  PENDING when the clinic resubmits its profile. These left entries in the audit log.
- Same branch, separate commit (the user's request): `/dashboard/schedule` slots use the
  mockup's colours — a 4 px left stripe (booked teal, request amber, blocked grey), open slots
  dashed; blocked reads "Blocked" with the reason under it.

## F6 — Community + Help center (2026-10-14, done)

- Screen list approved; "Treatment reviews" = the verified reviews (read-only). Mobile drawn
  first ("F6 — Community and CS": list, post, Help center).
- `/community?board=qna|reviews|tips|free` (+ `answered`, `text`, `sort`, `page`),
  `/community/detail?id=` (like, share, report, own Edit / Delete, `CommentList`),
  `/community/write?board=|id=` (boards by role, guidelines).
- `/cs?tab=faq|notice|inquiry`, `/cs/notice?id=`, `/cs/inquiry?id=` (thread, add message).
- Doctor Panel: Q&A Answers (`/doctor-panel/qna`, answer inline), My Articles
  (`/doctor-panel/articles`). Home Community board links to posts and "See all".
- Notifications: ARTICLE_COMMENT, DOCTOR_ANSWERED, INQUIRY_ANSWERED with links.
- `useShare` hook (clinic page + posts). 136 i18n keys × 5 languages.
- Cut (no API): post photos (health tips got them in F9) / tags / drafts / "in review", comment replies, author stats,
  inquiry attachments, translation of posts and answers, questions by specialty.
- Test data: the F4 test patient's inquiry stays (cleaned by `clean:test`); the test question,
  its answer and the doctor's test tip were removed.

## F5 — Clinic Dashboard + Doctor Panel (2026-10-14, done)

- The user chose one branch for all of F5; Doctor Panel (profile + review replies) included;
  mobile drawn for Dashboard, Schedule and Bookings on the MedVia Mobile canvas ("F5 — Clinic
  dashboard").
- `WorkspaceFrame` (generalised from MyPageFrame) → `MyPageFrame`, `ClinicFrame`, `DoctorFrame`.
  Header: patient "My Page", clinic "Clinic Dashboard" (`/dashboard`), doctor "Doctor Panel"
  (`/doctor-panel`).
- Clinic pages: `/dashboard` (stats, requests with AI summary / answers, today),
  `/dashboard/bookings` (Requests / Upcoming / Past / Cancelled, search, doctor filter),
  `/dashboard/schedule` (week grid / phone day list, block / open, Add slots),
  `/dashboard/chat` (`ChatConversation side="clinic"`, booking card above),
  `/dashboard/treatments` + `/edit` (draft review flow, photos, preview),
  `/dashboard/doctors` (create, hide / show, specialty, password reset, remove),
  `/dashboard/reviews` (`ReplyReviews`), `/dashboard/profile` (logo, photos, hours, languages,
  locked fields once verified, resubmit, notifications).
- Doctor Panel: `/doctor-panel` (profile, career, password; temporary-password notice),
  `/doctor-panel/reviews`. Clinic sign-up on `/account/join?mode=signup&as=clinic`.
- Notifications: clinic links lead into `/dashboard`; BOOKING_REQUESTED rendered in 5 languages.
- 268 i18n keys × 5 languages (ru plurals for reviews / views / min / yrs / slots).
- Cut: change assigned doctor, average response time, visit queue, map pin, "New review"
  switch, Doctor Q&A / Articles (F6).
- Test accounts (local): `f5.clinic@medvia.test` (PENDING clinic), `f5.doctor@medvia.test`
  (removed from Hanbit); F4's `f4.patient@medvia.test` made the requests. The seed clinic
  Hanbit got 17 extra open slots and one public reply (to Fazilat Z.'s review).

## F4 — MyPage (2026-10-14, done)

- Screen list approved with option (a) for the medical page: the API keeps no medical profile,
  so "Medical data & consent" = AI consent switch + "Who opened my data" (`getMyAccessLogs`).
  Mobile drawn first on the MedVia Mobile canvas ("F4 — My Page", 8 artboards), approved.
- `MyPageFrame` + `MyMenu`: band and sticky side menu on a computer, "‹ My Page" on a phone, the
  overview lists the sections there with counters. The frame owns the login guard (removed from
  My Bookings and Chat, which now sit inside it). Header "My Page" → `/mypage`.
- Pages: `/mypage` (greeting, search, next visit with Chat / Directions, review prompt, recently
  viewed), `/mypage/favorites` (`?tab=doctors`), `/mypage/recent` (Today / Yesterday / Earlier,
  Clear history), `/mypage/followings` (All / Clinics / Doctors / Members, unfollow),
  `/mypage/reviews` (+ prompts for reviewable visits, edit / delete, admin note),
  `/mypage/reviews/write?booking=|?review=`, `/mypage/profile` (photo upload, fields, three
  notification switches, change password dialog, log out), `/mypage/medical`.
- New: `useUpload` (REST upload, refresh-and-retry), `changePassword` in `libs/auth`,
  `isReviewable` (the API's 30-day rule), `LIST_MAX = 50` (the API's `@Max(50)`; also fixes My
  Bookings' "Show more" past 50), `StatusChip label`, optional like button on `DoctorCard`.
  131 i18n keys × 5 languages.
- Cut (no API): medical profile fields, retention / research consents, Promotions switch,
  Delete account, Google connect, review photos, articles in Recently Visited, clearing a phone.
- Checked with test patient `f4.patient@medvia.test` (local; `npm run clean:test -- --yes`
  removes it): full review life cycle, favorites, followings, recent, AI consent on/off, photo
  upload, profile save, password change; desktop 1440 + phone 375, RU; `build:check` passes.
- Dev note: after editing locale JSON, a client-side locale switch can show the old strings
  until a full page load (dev only).

## F3 — chat and notifications (2026-10-13, done)

- Mobile drawn first ("F3 — chat and notifications": chat list, chat room, notifications).
- `socket.io-client@4` (planned for F3; the API is Socket.IO): one socket per signed-in member
  (`useLiveSocket`, mounted in `_app`), handshake `auth: { token }`; when the server cuts it at
  token expiry ("io server disconnect") or refuses the handshake, refresh and reconnect.
  Events go out on `liveEvents`; the hook itself bumps the unread count, evicts the
  notification lists and refetches the room list.
- Header bell (patients and every signed-in member): unread badge, desktop menu with the latest
  5 and "Mark all as read", phone → `/notifications`. `/notifications`: All / Bookings / Chat,
  Today / Earlier (Seoul day), texts rendered on the client from type + params
  (`libs/notificationText.ts`) in the reader's language.
- `/mypage/chat?room=`: rooms with search and unread counts, the room with cursor history,
  socket messages and translations merged by `_id`, "Sent in Korean", "Translated from …
  · Show original", "Translating…", neutral system lines; on a phone list and room are two
  screens, the room full-screen. Translation needs the patient's AI consent — a banner turns it
  on (`setAiConsent`). "Chat with clinic" (clinic page card and bar, Request sent, My Bookings)
  opens the room (`openRoom`, patients only).
- Also on this branch: "My Page" only for patients (others get their area in F5 / F7),
  the signup phone sample is Korean (+82), logout always lands on the home page (every tab)
  without first re-rendering the page as a guest (no "Please log in" flash — `leaveForHome`).
- Checked: chat opened from the clinic page, AI consent on, a message sent and its Korean
  translation arriving over the socket, room list updated live, empty notifications page and
  bell menu, mobile chat. Not checked with data: notifications (the test patient has none —
  they come when a clinic confirms or replies, F5 / playground).

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

Every command (run, checks, seed, cleanup, git hygiene) is collected in `docs/COMMANDS.md`.

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
  Done 2026-10-15 with licensed stock photos (Unsplash / Pexels), see F9.
  Clinic signup (the mockup's SignupClinic form) is planned for F5, with the Clinic Dashboard.

- **F9 deploy plan (the user's choices, 2026-10-14):**
  - Server: Hostinger VPS **KVM 1** (1 vCPU, 4 GB RAM, 50 GB NVMe) is enough — API + batch +
    `next start` + Redis + Nginx ≈ 1–1.2 GB; MongoDB stays on Atlas. `next build` peaks at
    1–2 GB: add 2 GB swap, or build on the laptop / GitHub Actions and ship the result. KVM 2 only
    if building on the server must be fast. Check the renewal price before paying.
  - **A new, strong `SEED_PASSWORD` in production** (and a new admin password): today's seed
    password is a weak demo one, and the demo accounts (`feride@`, `clinic01@`, `doctor01@`,
    `admin@seed.medvia.test`) will be reachable on the public site.
- Google sign-in: built (F9); needs the OAuth client id in both `.env` files.
- Before deploy (F9): re-check `yarn audit` for Next 14 (current advisories are mostly App Router /
  middleware / `next/image`). The photos are local and generated (2026-10-16).
- `yarn build:check` builds into `.next-check/` while `yarn dev` runs (F1 passed: 47 static
  pages). Run it before every merge; the real `yarn build` is for deploy.
- A test patient from the browser checks, `f1.feride@medvia.test`, stays until the backend's
  `npm run clean:test -- --yes` (or the next `npm run test:api`) removes it.
- The demo seed was rebuilt several times on 2026-10-12/13 (`--reset`): clinic and doctor ids
  changed; old links with ids no longer resolve.
- `hero.jpg` (once the design folder's sample with no recorded source) is generated since
  2026-10-16, like every photo of the site.
