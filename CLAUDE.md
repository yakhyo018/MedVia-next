# MedVia-next

The frontend of MedVia — the medical-tourism platform: foreign patients (RU/UZ/KK) book verified
Seoul clinics. Next.js (pages router) client of the NestJS GraphQL API in `~/Desktop/MedVia`.
Portfolio project: no SMS, no outgoing email, no payments.

## Read first

- **`docs/STATUS.md` — at the start of every session.** Where the frontend stands, the next step,
  how we work. Update it whenever a milestone closes.
- `LEARN.md` — why each mechanism exists, trade-offs, interview Q&A. Update after every milestone.
- `docs/DECISIONS.md` — Decision / Why / Risks / Alternatives.
- `docs/COMMANDS.md` — every terminal command (run, checks, seed, cleanup). Add new ones there.
- The backend's rules and API: `~/Desktop/MedVia/CLAUDE.md`, `~/Desktop/MedVia/docs/STATUS.md`,
  schemas in `~/Desktop/MedVia/apps/medvia-api/src/libs/dto` (the GraphQL contract).

## Origin

Structure, code style and reusable logic come from **`~/Desktop/nestar-client`** (its package
name is `nestar-next`). Read it, never edit it. Look comes from the mockups in
**`~/Desktop/MedVia-design`** (`prototype/index.html` — 61 screens, `source/*.dc.html`, `screens/`).
Never ported: anything `property`, raw WebSocket / `WebSocketLink`, `apollo-upload-client`,
`jwt-decode` profiles, `memberNick`, Three.js `FiberContainer`, `nouislider-react`.
After porting any file: `rg -n "nestar|Nestar|property|Property" <file>` must return nothing.

## Stack (same majors as nestar-next — decided 2026-10-12)

Next.js 14 (**pages router**), React 18.2, TypeScript, MUI 5 + Emotion, Apollo Client 3,
`next-i18next`, SCSS (`scss/pc`, `scss/mobile`), `sweetalert2`. Package manager **yarn 1** (`yarn.lock`, like nestar-next); never `npm install` — it would write a
`package-lock.json` beside it.
Dev server on **port 4000** (the API's CORS allows only `FRONTEND_URL=http://localhost:4000`).
No package is added without stating which problem it solves and why not the alternative; later
milestones add `socket.io-client` (F3), `@react-oauth/google`, `swiper`, … when needed.

## Project shape (mirror of nestar-next)

```
apollo/           client.ts (initializeApollo / useApollo), store.ts (makeVar: userVar, …)
  user/           query.ts, mutation.ts        (UPPER_SNAKE gql constants)
  admin/          query.ts, mutation.ts
libs/
  auth/           index.ts  (logIn, signUp, restoreSession, updateUserInfo, logOut)
  components/     layout/ (withLayoutHome, withLayoutBasic, withLayoutFull, withLayoutAdmin),
                  common/ (cards, StatusChip …), <section>/ per page, Top.tsx, Footer.tsx
  enums/          <entity>.enum.ts   (mirror the backend enums; value equals name)
  types/          <entity>/<entity>.ts, .input.ts, .update.ts; common.ts (T)
  hooks/          useDeviceDetect, useAuth, useLiveSocket, useNotifications, useLikeTarget,
                  useFollow, useUpload, useSeoulTime
  config.ts       env URLs, Messages (same texts as the backend's Messages enum)
  sweetAlert.ts   nestar-next's 11 functions, MedVia look (see Design)
  utils.ts        formatKrw ("₩99,000"), seoulTime …
pages/            <section>/index.tsx, detail.tsx; _admin/ for admin; account/join.tsx
scss/             MaterialTheme/ (tokens.ts + theme), _tokens.scss, pc/<section>/, mobile/
public/locales/   en, ru, uz, kk, ko   (common.json …)
```

## Code style (identical to nestar-next)

- `.prettierrc`: tabs (width 2), single quotes, trailing commas, semicolons, `printWidth` 120.
- A page, always in this order:
  ```tsx
  export const getStaticProps = async ({ locale }: any) => ({
  	props: { ...(await serverSideTranslations(locale, ['common'])) },
  });

  const ClinicList: NextPage = ({ ...props }: T) => {
  	const device = useDeviceDetect();
  	const router = useRouter();
  	const [searchFilter, setSearchFilter] = useState<ClinicsInquiry>(DEFAULT_INPUT);

  	/** APOLLO REQUESTS **/
  	/** LIFECYCLES **/
  	/** HANDLERS **/   // names end in …Handler; try/catch → sweetMixinErrorAlert(err.message)

  	if (device === 'mobile') {
  		return <div>…</div>;
  	} else {
  		return <div id="clinic-list-page"><div className="container">…</div></div>;
  	}
  };

  export default withLayoutBasic(ClinicList);
  ```
- Components: `interface XProps`, `const X = (props: XProps) => { const { … } = props; … }`,
  MUI `Stack` + `className`, current user via `useReactiveVar(userVar)`.
- SCSS: `#pc-wrap { #<page-id> { .container { … } } }`, one folder per section.
- **Four deliberate differences from nestar-next:** no `Component.defaultProps` (deprecated in
  React 18.3, removed in 19) — a `const DEFAULT_INPUT` above the page instead; no `any` /
  `@ts-ignore` where a type exists (use `T` or the real type); `===` never `==`; meaningful
  `Messages` names (no `error2`).

## Backend contract (rules the client must follow)

- **Auth:** access token (15 min) lives **in memory only** (a module variable / `makeVar`),
  never `localStorage` (XSS). The refresh token is the backend's httpOnly cookie `medvia_rt`
  (path `/graphql`, SameSite Lax): every GraphQL request uses `credentials: 'include'`.
  On page load `restoreSession()` calls `refreshToken`; on `UNAUTHENTICATED` the error link
  refreshes once and retries. Logout = `logout` mutation, then a `localStorage` "logout"
  timestamp so other tabs follow (nestar-next's storage-event trick, kept).
- **The JWT carries no profile** (`{ sub, memberType, iatMs, jti }`): `userVar` is filled from
  `getMyProfile`, never by decoding the token.
- Login and signup by **email** (`LoginInput { memberEmail, memberPassword }`,
  `MemberInput { memberType, memberEmail, memberPassword, memberFullName, memberLang,
  termsAccepted, memberPhone?, memberCountry? }`); Google sign-in later (`googleLogin`).
- Realtime: **socket.io-client** to namespace `/live`, access token in the handshake
  `auth: { token }`; events `message:new`, `room:updated`, `message:translated`,
  `notification:new`. Reconnect with a fresh token after the 15-minute cut.
- Uploads: REST `POST {API}/upload/image?target=<clinic|doctor|member|…>` (multipart `file`),
  not GraphQL.
- Dates are stored UTC and **shown in Asia/Seoul**; prices in KRW.
- Languages: `KO`, `EN`, `RU`, `UZ`, `KK` (the backend `Language` enum); locales en/ru/uz/kk/ko.

## Design (Motion redesign, 2026-10-21 — tokens live in one place)

`scss/MaterialTheme/tokens.ts` + `scss/_tokens.scss`; the MUI theme, sweetalert and SCSS all read
them. The look: `scss/pc/skin.scss` (computer), `scss/mobile/skin.scss` (phone), shared mixins in
`scss/pc/_skin-mixins.scss` (aurora, glass, grid, parts that look the same on both). Mockups:
`docs/design-alternatives/motion-pages-green/` (not in git).
- Primary teal `#0B7A8A` (hover `#168390`, dark `#086170`, tint `#E4F3F0`); text `#0F2A2A`,
  secondary `#566B68`, muted `#8A9C98`; borders `#E1EAE6` / `#D6E2DD`; page background `#F5F8F7`.
- Decoration only, never under text: mint `#3DB39A`, leaf `#5FAE6E`, coral `#FF7E6B`.
  Dark surfaces (footer, workspace / admin side menus, dark cards): ink `#0F2A2A`.
- Text-bearing gradient = `#086170 → #0B7A8A` only (white text keeps 4.5:1).
- Success `#15803D` on `#E7F6EC`; warning `#B45309` on `#FEF3E2`; danger `#C0392B` on `#FDECEA`.
- Buttons: pills (radius 999), 44px, `0 22px`, 14px/600, primary = gradient + soft shadow (small: 36px);
  cards radius 22–28px; fields radius 14px, focus = teal border only (no halo); modal radius 24px.
- Fonts: Onest (headings — has Cyrillic for RU/UZ/KK), Inter (text).
- Header transparent over the first band's aurora, glass once scrolled; the first band slides under it.
- Motion: CSS only (`scss/motion.scss`), `transform` / `opacity`, everything stops under
  `prefers-reduced-motion`.
- **Alerts:** keep nestar-next's sweetAlert function names; `Swal.mixin` with
  `buttonsStyling: false` + `customClass` → MedVia classes: confirm modal (teal confirm, outlined
  cancel), `sweetDangerConfirmAlert` (red confirm: cancel booking, delete), error (danger
  icon), top toast (white pill, green mark), login prompt (teal → `/account/join`). Backdrop
  `rgba(15,42,42,.45)`. Button texts and titles from i18n.
- Shared UI: `StatusChip` (CONFIRMED/ACTIVE green, PENDING amber, DECLINED/CANCELLED red,
  COMPLETED teal), MUI overrides for Button/TextField/Chip/Tabs, teal spinner + skeletons, empty
  state, red 12px field errors. A dev-only page `/_dev/ui` shows every variant.

## Workflow

1. Plan before editing. For anything non-trivial, show the plan and wait for a yes.
2. Explain what was built: problem → alternatives → code → 3-5 interview questions with answers.
3. Keep changes small and in the nestar-next pattern. Never delete working logic without a
   replacement.
4. Update `LEARN.md` after each milestone. Answer in Uzbek; code and comments in English.
5. Verify in the browser (Browser pane), desktop and mobile width, against the mockup — not only
   `build`.

## Milestones and gates

F0 Skeleton · F1 Public pages · F2 Booking flow · F3 Chat + notifications · F4 MyPage ·
F5 Clinic dashboard · F6 Community + CS · F7 Admin · F8 Assistant UI · F9 Deploy.
Every milestone: **screen list review with the user** (which mockup screens, which API calls,
what is cut) → build → browser check (screenshots vs mockup) → explain + LEARN.md → the user
checks it → merge.

## Git

`main` ← `develop` ← `feature/<milestone>`. Conventional commits (feat/fix/refactor/test/chore).
No `Co-Authored-By` or other Claude attribution in commit messages.
Before every commit: stage files by name (never `git add -A`), read `git diff --cached`, and the
staged diff must not match:
```bash
git diff --cached | grep -nE "sk-or-[A-Za-z0-9_-]{10,}|sk-ant-[A-Za-z0-9_-]{10,}|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}|GOOGLE_CLIENT_SECRET=[^ ]+"
```
`.env.local` is git-ignored; `.env.example` holds placeholders only.

## Validation

```bash
yarn typecheck
yarn lint:check
yarn build                  # never while `yarn dev` runs — both write .next/
yarn dev                    # http://localhost:4000 — needs the API: cd ~/Desktop/MedVia && npm run start:dev
```
There is no `yarn lint` with `--fix` on purpose (same reason as the backend).
