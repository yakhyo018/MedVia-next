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
