# LEARN — MedVia-next

Why each mechanism exists, the trade-offs, and interview questions with answers. One section per
milestone (F0 …). Written after each milestone, in English.

## F0 — Skeleton (2026-10-12)

### 1. Where the access token lives

**Problem.** The API gives a 15-minute access token and keeps a refresh token in an httpOnly
cookie (`medvia_rt`). nestar-next kept its token in `localStorage` and decoded it with
`jwt-decode` for the profile.

**Alternatives.** `localStorage` (survives reloads, but any injected script can read it) ·
a non-httpOnly cookie (same XSS problem, plus CSRF) · **memory only** (chosen).

**Code.** `libs/auth/index.ts`: `let accessToken = ''` — a module variable. A reload empties it;
`_app.tsx` calls `restoreSession()`, which sends `refreshToken` (the browser attaches the cookie
because `HttpLink` has `credentials: 'include'`). The profile comes from the API's response,
never from decoding the JWT — the JWT carries only `{ sub, memberType, iatMs, jti }`.
Auth mutations use `fetchPolicy: 'no-cache'` so the token never lands in the Apollo cache.

`localStorage` still holds three harmless things: `medvia:session` = "1" (a hint, so a browser
that never logged in does not send a refresh request on every page) and the `login` / `logout`
timestamps other tabs listen to.

### 2. Refresh without races

**Problem.** The API rotates the refresh token on every use; presenting an old one after a
10-second grace is treated as theft and ends the session. React StrictMode runs effects twice,
two parallel queries can both fail with UNAUTHENTICATED, and two tabs can reload together —
each of those would send the same cookie twice.

**Code.** `refreshAccessToken()`:
- one shared promise per tab (`refreshing`) — every caller waits for the same request;
- `navigator.locks.request('medvia:refresh', …)` — the Web Locks API queues tabs of the same
  origin, so the second tab runs only after the first has stored the rotated cookie.

`apollo/client.ts` `errorLink`: on `UNAUTHENTICATED` (and only when we had a token, the operation
is not Login/Signup/RefreshToken, and it was not already retried) it returns an `Observable`
that waits for the refresh and then `forward(operation)` — the `authLink` after it reads the new
token. If the refresh fails, the caller gets the original error. `Logout` is deliberately *not*
excluded: after 15 idle minutes it must refresh and retry, or the server session would survive.

A network error during refresh keeps the session hint (try again on the next load); only the
API saying "no session" forgets it.

### 3. Cross-tab logout

The `storage` event fires in every *other* tab when one tab writes a key. `logOut()` writes
`logout`; `listenSessionEvents()` (registered in `_app.tsx`) clears the token, `userVar` and the
Apollo cache in the others. `login` makes the others call `refreshAccessToken()`. A refresh never
writes `login` — otherwise two tabs would ping-pong refreshes forever.

### 4. One source of design tokens

`scss/MaterialTheme/tokens.ts` holds every colour, radius and shadow. The MUI theme imports it;
`MuiCssBaseline` writes it onto `:root` as CSS custom properties (`--mv-primary` …);
`scss/_tokens.scss` maps SCSS names to those variables; SweetAlert's classes use the same SCSS
names. Trade-off: Sass colour functions (`rgba($primary, .5)`) cannot work on `var()`.

### 5. SweetAlert in the MedVia look

`Swal.mixin({ buttonsStyling: false, customClass: {...} })` turns off SweetAlert's own button
styles and puts our classes on every part (`scss/alert.scss`). nestar-next's function names are
kept, so pages call the same `sweetMixinErrorAlert(err.message)`. Alerts live outside React,
so they translate through the `i18n` instance from `next-i18next`.

### 6. i18n

Five locales in the URL (`/ru/…`, default `en` without a prefix), `localeDetection: false`.
Keys are the English sentences, so `keySeparator: false` / `nsSeparator: false` — a dot or colon
in "Welcome back." is text, not a nested path. Server messages are keys too: the API answers
"Wrong email or password!", the alert shows the Russian line.

### 7. Motion

CSS only (`scss/motion.scss`): staggered fade-up on load (`--mv-delay`), lift on hover, header
shadow after scroll, form fade when Log in ↔ Sign up (a React `key` remounts the fields).
`prefers-reduced-motion: reduce` turns it all off. No `framer-motion`: nothing here needs
JavaScript-driven animation, and it would add ~40 kB.

### Interview questions

1. **Why not keep the JWT in localStorage?** Any XSS can read localStorage and send the token
   away; a memory variable dies with the page, and the long-lived secret (refresh token) is in an
   httpOnly cookie script cannot read. The cost is one refresh request per page load.
2. **Your refresh token rotates. What breaks if two requests refresh at once?** The second
   presents a token that was just rotated away; after the grace window the server treats it as a
   replay and kills the session. We share one promise per tab and serialise tabs with Web Locks.
3. **How does the client retry a query after refreshing?** The Apollo error link returns a new
   `Observable`; it subscribes `forward(operation)` after the refresh resolves. The auth link
   sits after the error link, so the retried request reads the new token. A `retried` flag in
   the operation context prevents loops.
4. **How do tabs learn about a logout?** The `storage` event: writing a key in one tab fires the
   event in all other same-origin tabs. Each clears its own in-memory token and cache.
5. **The SameSite=Lax cookie is on `localhost:3000`, the app on `localhost:4000` — why is it
   sent?** SameSite compares *sites* (scheme + registrable domain), not origins; ports do not
   matter. CORS still needs `credentials: 'include'` on the client and
   `Access-Control-Allow-Credentials` + an exact origin on the server.

## F1 — Public pages (2026-10-12 / 13)

Home bands, `/clinics`, `/doctors`, `/doctors/detail`, `/clinics/detail`.

### 1. Filters live in the URL

**Problem.** A patient filters clinics (district, specialty, ₩ range, languages, interpreter,
sort, page) and expects Back, Forward, reload and a shared link to show the same list.

**Alternatives.** `useState` only (lost on reload, Back leaves the page) · a global store (same) ·
**the query string is the state** (chosen).

**Code.** `pages/clinics/index.tsx` / `pages/doctors/index.tsx` read `router.query`, turn it into
the API input (`ClinicsInquiry`), and every filter change is a `router.push` of new query keys
(`text, specialty, district, lang, min, max, interpreter, sort, page`). Unknown values are
ignored, so a hand-edited URL cannot send a bad enum to the API. The clinic page does the same
with `?doctor=`: "Show all doctors" is `router.replace(..., { shallow: true })`.

GraphQL detail found on the way: enums travel **by name** (`direction: "DESC"`), not by the
backend's numeric value.

### 2. Ids from the URL are checked before they reach the API

`isObjectId()` (`libs/utils.ts`) — a 24-hex test. `?id=nope` never becomes a request; the page
shows "Clinic not found" at once. Queries use `skip: !validId`.

### 3. Like and Follow without a refetch

`useLikeTarget` / `useFollow` update the cached object directly:
`cache.modify({ id: cache.identify({ __typename: 'Clinic', _id }), fields: { meLiked, clinicLikes } })`.
Every card and header showing that clinic re-renders from the same normalized entry. A guest gets
the login prompt and returns to the page (`?referrer=`); a like from a clinic, doctor or admin
account is refused in the client before the API would refuse it. Follow targets the **account** behind the clinic
(`Clinic.memberId`), not the clinic's `_id`.

### 4. Queries sent before the session is back

On a reload the page's queries can leave before `restoreSession()` has a token — they go out as
a guest and `meLiked` / `meFollowed` come back empty. Once the refresh succeeds,
`refetchQueries({ include: 'active' })` runs the queries on screen once more with the token.

### 5. Recommended, not top-rated

Home and list default sort is `clinicScore` / `doctorScore` — the backend batch's rank (rating
weighted by how many reviews it stands on, recent visits, followers). Sorting by raw rating would
put one 5-star review above forty 4.8 ones.

### 6. The clinic page

- **One booking card, two places.** `BookingCard` is the sticky side card on desktop and the
  content of a MUI bottom `Drawer` on mobile, opened from a fixed "Book" bar. One component, one
  state (picked treatment and doctor live in the page).
- **Derived state instead of effects.** The selected treatment is computed each render: the
  patient's pick if it still exists, else the cheapest one the `?doctor=` doctor performs, else
  the cheapest. No `useEffect` that copies props into state and runs a render behind.
- **Map without a key.** An OpenStreetMap embed iframe from `clinicLocation` (`[lng, lat]` —
  GeoJSON order). Kakao / Google Maps need an API key; `react-leaflet` would add a package.
- **Opening hours.** `openingHours()` folds the week into lines ("Mon–Sat 09:00–19:00"); weekday
  names come from `Intl.DateTimeFormat(locale, { weekday: 'short' })`, so Russian reads "пн–сб".
- **Photo grid by count.** `count-1` … `count-5` classes change the grid; the seed has two photos
  per clinic, the mockup five.
- **Honest UI.** The mockup's "replies within 15 min" and the home's "Events and promotions" have
  no data behind them: the first was cut, the second became two static cards about what MedVia
  really does (interpreters, prices), each opening a filtered clinic list.

### 7. Plurals

i18next (v23) picks the form with `Intl.PluralRules`: `t('{{count}} specialists', { count })`
reads `_one / _few / _many / _other` keys in Russian and `_one / _other` in English —
"3 специалиста", "5 специалистов". Gluing a number to a fixed word gives "3 специалистов".

### 8. Mobile layout lessons

- A flex child is at least as wide as its widest content (`min-width: auto`). The clinic page's
  doctor strip pushed the column to 700 px and the whole page scrolled sideways —
  `min-width: 0` on the column fixed it.
- `scroll-snap` snaps a card to the scroller's edge; with a 16 px gutter the first card jumped
  under it. `scroll-padding: 0 16px` moves the snap line. Both now live in the `swipe-row`
  mixin (`scss/mobile/main.scss`).
- The fixed Book bar covered the end of the footer: `#mobile-wrap:has(.book-bar) #footer`
  adds bottom padding only on pages that have the bar.

### 9. Home carousels

`swiper@11` (nestar-next's home bands use Swiper; 11 rather than nestar's 8 — maintained, cleaner
module imports). `HomeCarousel` uses MUI buttons for the arrows: they sit outside `<Swiper>`, so
their elements are handed to the Navigation module in `onBeforeInit`. `slidesPerView: 'auto'`
with a CSS slide width on a phone (one card and the edge of the next), `breakpoints` for 2 and
4 per view. No autoplay — moving content is hard to read and fails WCAG 2.2.2 without a pause.

### Interview questions

1. **Why put list filters in the URL?** The URL is state the browser already keeps: Back /
   Forward, reload and shared links work for free, and the page is a pure function of its URL.
   The cost is parsing and validating query values.
2. **How does a like show up on every card without refetching?** Apollo normalizes objects by
   `__typename` + `_id`; `cache.modify` changes that one entry and every query that references
   it re-renders.
3. **Why compute the selected treatment instead of storing it with `useEffect`?** Copying props
   into state in an effect renders twice and can drift out of sync; deriving it each render
   from the inputs is always right and simpler.
4. **What does `min-width: 0` fix in flexbox?** Flex items default to `min-width: auto` — they
   cannot shrink below their content. Long or non-wrapping content then overflows the parent;
   `min-width: 0` lets the item shrink and its own overflow rules apply.
5. **How do plural forms work across languages?** `Intl.PluralRules(locale).select(n)` returns
   a category (`one`, `few`, `many`, `other`); i18next appends it to the key. English has two
   categories, Russian four, Korean one.

## F2 — Booking (2026-10-13)

Clinic page date and time → hold → `/booking` (questionnaire, review and consent, sent) →
`/mypage/bookings`. The clinic's answer (confirm / decline) is F5.

### 1. Hold first, ask questions second

**Problem.** Filling a questionnaire takes minutes; another patient could take the same time
meanwhile, and the first patient would learn it only on "Send".

**Alternatives.** Book at once and ask questions later (the clinic gets an empty request) ·
check availability only on send (lost work) · **hold the slots for 10 minutes, then ask**
(chosen — the backend's design).

**Code.** "Request booking" calls `holdSlots`; the API reserves the treatment's consecutive
slots in one transaction (a racing patient gets `SLOT_NOT_AVAILABLE`) and returns
`holdExpiresAt`. `/booking` shows a countdown from that time (`BookingSummary`); at zero, or when
`createBooking` answers `HOLD_EXPIRED` / `SLOT_NOT_AVAILABLE` / `SLOT_TOO_SOON`, the patient is
sent back to the clinic page to pick again. The countdown runs on the server's timestamp, so
the client never decides alone that a hold is still valid.

### 2. "Any available doctor" without a backend change

`getAvailableSlots` answers for one doctor. `useAvailableSlots` asks every doctor who performs the
treatment (`Promise.all`), merges the answers by start time and remembers which doctor has each
time. The chosen time decides the doctor ("With Dr. …"), and the hold is made for that doctor.
A stale answer is ignored with a `cancelled` flag in the effect's cleanup — a fast date change
must not show the previous day's times.

### 3. Times and days are Seoul's

The API stores UTC and takes a Seoul calendar day (`date: "2026-10-14"`). The date strip comes
from `seoulDays()` and every time is printed with `seoulClock()` — both `Intl.DateTimeFormat` with
`timeZone: 'Asia/Seoul'`. A patient in Tashkent sees 12:00 for a 12:00 Seoul visit, which is the
time on the clinic's door.

### 4. Medical answers never touch the URL

The URL of `/booking` carries only what was held: ids, start, hold end, interpreter. The answers
live in React state. URLs end up in history, logs, `Referer` headers and screenshots;
`localStorage` is readable by any injected script. The cost: a reload empties the form — the
hold is still there, the patient types again.

### 5. Consents are explicit and versioned

Three checkboxes, all unticked: `SHARE_DATA` and `BOOKING_TERMS` required, `AI_SUMMARY` optional.
The client sends all three with `agreed: true|false`; the API stores each with its version
(`share-v1`, `terms-v1`) and the time, and writes the Korean AI summary only when that consent
is given — after the request, for the doctor. That is why the mockup's "AI summary preview" was
cut: there is nothing to preview before sending.

### 6. One mutation, a table of allowed moves

`updateBookingStatus` serves the patient, the clinic and the admin. The backend keeps a
transition table (PENDING → CONFIRMED / DECLINED by the clinic, → CANCELLED by the patient; a
confirmed visit cancelled by the patient only 24 h ahead; a reason required for a decline). The
client mirrors only what it must show: My Bookings offers "Cancel" when the move is allowed and
explains when it is not; the server stays the judge.

### Interview questions

1. **Two patients press "Request booking" on the same slot at once. What happens?** Both holds
   run in transactions that update the same slot documents; MongoDB commits one and gives the
   other a write conflict, the retry no longer matches "free", and that patient gets
   `SLOT_NOT_AVAILABLE` and picks another time.
2. **Why does the countdown use `holdExpiresAt` from the API instead of "10 minutes from now"?**
   The server owns the hold; the client clock can be wrong and the request took time. Showing
   the server's deadline keeps both sides in agreement.
3. **How do you merge results from several requests safely in a React effect?** Start them with
   `Promise.all`, and in the cleanup set a `cancelled` flag so an answer for old inputs is
   dropped instead of overwriting newer state.
4. **Why not keep the questionnaire in localStorage so a reload keeps it?** It is health data.
   Any XSS can read localStorage and it outlives the session on a shared computer; losing a form
   on reload is the cheaper risk.
5. **Where are booking rules enforced — client or server?** The server: the transition table,
   the 24-hour rule and the required reason. The client only hides buttons that would fail and
   shows the server's message when something still does.

## F3 — Chat and notifications (2026-10-13)

The header bell, `/notifications`, `/mypage/chat`, and one live socket under all of them.

### 1. One socket, push only

**Problem.** A clinic's reply, a translation that finishes a few seconds later, a "booking
confirmed" — the patient should see them without reloading.

**Alternatives.** Polling every few seconds (simple, but a request per tab per interval, and
always late) · GraphQL subscriptions (a second transport the API does not have) ·
**Socket.IO namespace `/live`, push only** (chosen — the API's gateway).

**Code.** `libs/hooks/useLiveSocket.ts`, mounted once in `_app.tsx` inside `ApolloProvider`:
- `io(`${REACT_APP_API_WS}/live`, { auth: { token }, transports: ['websocket'] })`. The access
  token lives in memory, not in a cookie, so it is handed over in the handshake; the server joins
  the socket to `member:<id>` (and a clinic account to `clinic:<id>`).
- The effect depends on `user._id`: login opens the socket, logout closes it; a guest has none.
- The socket only says *that* something changed. Every write still goes through GraphQL, and a
  page opened later reads the truth from GraphQL — a lost event costs freshness, never data.

### 2. Living with a 15-minute token

The server cuts the socket when the handshake token expires (`reason === 'io server
disconnect'`). Socket.IO does not reconnect after a server-side cut, and on a refused handshake
(`connect_error`) its own retries would resend the same dead token. Both handlers call
`refreshAccessToken()` — the F0 function with one shared promise per tab and a Web Lock across
tabs — then set `socket.auth = { token: newToken }` and `connect()` again.

### 3. An event bus between the socket and the pages

`liveEvents` is a plain browser `EventTarget`; each socket event is re-dispatched as a
`CustomEvent`. The socket does not know which components care; a component subscribes in an
effect and unsubscribes in its cleanup.
- Global effects live in the hook: `notification:new` bumps the unread count with
  `cache.updateQuery` (no request) and evicts `getMyNotifications` so the lists on screen read
  again; `room:updated` refetches `getMyRooms`.
- The open room (`ChatConversation`) listens to `message:new` and `message:translated` for its
  own `roomId`.

### 4. Merging messages by `_id`

The patient's own message arrives twice — in the `sendMessage` response and as `message:new`
from the server; a translation arrives later as `message:translated` with the same `_id`.
`merge()` keeps one copy per `_id` (the newer fields win) and sorts by `createdAt`. History is
paged by cursor (`before: nextCursor`), not by page number: new messages keep arriving, so
"page 2" would shift under the reader.

Socket payloads have no `displayText` (the API computes it per viewer in GraphQL), so the client
repeats the backend's `textFor`: the original if it is in the reader's language, else the
translation, else the original.

### 5. Translation needs consent

The API translates a chat only when the patient allowed AI processing (`memberAiConsentAt`);
otherwise messages are `SKIPPED`. The chat shows a banner that calls `setAiConsent(true)` and
updates `userVar`, instead of silently showing untranslated text.

### 6. Notifications in the reader's language

The API stores an English title and description plus `notificationParamsJson`. The client
renders known types from the type and params with i18n templates (`libs/notificationText.ts`)
and falls back to the server's English for a type it does not know. "Today" / "Earlier" use the
Seoul calendar day, like every date on the site.

### Interview questions

1. **Why not keep the socket inside the chat page?** Notifications arrive on every page; one
   connection in `_app` serves all of them and survives client-side navigation. A page-level
   socket would reconnect on every route change.
2. **How does the socket authenticate without cookies?** The access token goes in the
   handshake's `auth` field; the gateway verifies it in its middleware before the connection is
   accepted, then joins the socket to per-member (and per-clinic) rooms.
3. **What happens when the access token expires mid-connection?** The server disconnects the
   socket; the client sees `io server disconnect`, refreshes the token (deduplicated across
   tabs), puts the new token in `socket.auth` and reconnects.
4. **The sender receives its own message twice. How do you avoid a duplicate bubble?**
   Idempotent merge by `_id`: the second copy (or the translated copy) replaces the first instead
   of being appended.
5. **Why push only, and not write through the socket?** GraphQL already has validation, auth
   guards and errors per field; a second write path would duplicate them. With push-only, a
   missed event is fixed by the next query — the socket can be lossy without losing data.
