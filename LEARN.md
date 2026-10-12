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
