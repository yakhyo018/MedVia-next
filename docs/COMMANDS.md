# Commands

Every terminal command we use for MedVia, in one place. Backend = `~/Desktop/MedVia` (npm),
frontend = `~/Desktop/MedVia-next` (yarn — never `npm install` here). Add a line whenever a new
command comes up.

## Run

```bash
cd ~/Desktop/MedVia && npm run start:dev           # API on :3000 (Atlas + local Redis)
cd ~/Desktop/MedVia && npm run start:dev:batch     # batch on :3001 (only for batch features)
cd ~/Desktop/MedVia-next && yarn dev               # app on :4000 (needs the API)
```

- Never `yarn build` while `yarn dev` runs (both write `.next/`). If the dev server breaks:
  stop it, `rm -rf .next`, start again.
- After `yarn add <package>`: restart `yarn dev`.

## Check before a merge (frontend)

```bash
cd ~/Desktop/MedVia-next && yarn typecheck
cd ~/Desktop/MedVia-next && yarn lint:check
cd ~/Desktop/MedVia-next && yarn build:check       # safe beside yarn dev (writes .next-check/)
cd ~/Desktop/MedVia-next && yarn i18n:check        # every locale has every key (fallbackLng is off)
cd ~/Desktop/MedVia-next && npx prettier --check "pages/**/*.tsx" "libs/**/*.{ts,tsx}" "scss/**/*.scss" "apollo/**/*.ts"
```

`yarn build` (writes `.next/`) is for deploy only.

## Check (backend)

```bash
cd ~/Desktop/MedVia && npm run typecheck
cd ~/Desktop/MedVia && npm run lint:check
cd ~/Desktop/MedVia && npm test                    # Jest unit tests
cd ~/Desktop/MedVia && npm run test:api            # Postman run (needs the API running); cleans test data at the end
cd ~/Desktop/MedVia && KEEP_TEST_DATA=1 npm run test:api   # same, but keeps what it created
cd ~/Desktop/MedVia && npm run test:socket         # socket.io smoke test
```

## Demo data and test accounts

```bash
cd ~/Desktop/MedVia && npm run seed:demo           # demo DB: 15 clinics, 40 doctors, 50 patients (refuses if it exists)
cd ~/Desktop/MedVia && npm run seed:demo -- --reset   # remove the demo data and seed again (ids change!)
cd ~/Desktop/MedVia && npm run seed:admin          # the admin account
cd ~/Desktop/MedVia && npm run clean:test          # dry run: shows what the cleanup would remove
cd ~/Desktop/MedVia && npm run clean:test -- --yes # removes every @medvia.test / @clinic.test / @test.com account and what it owns
```

- Demo logins: `feride@` (patient), `clinic01@` (clinic), `doctor01@` (doctor),
  `admin@seed.medvia.test`; password = `SEED_PASSWORD` in `~/Desktop/MedVia/.env`.
- Accounts made during browser checks end in `@medvia.test` (e.g. `f4.patient@`, `f5.clinic@`,
  `f5.doctor@`) — `clean:test -- --yes` removes them. It does **not** undo changes made to seed
  data (extra slots, replies); `seed:demo -- --reset` does.

## AI evaluation (backend)

```bash
cd ~/Desktop/MedVia && npm run eval:translate      # chat translation quality run
cd ~/Desktop/MedVia && npm run eval:assistant      # assistant answers run
```

## Git (commit hygiene)

```bash
git add <files by name>                            # never git add -A
git diff --cached                                  # read what goes in
git diff --cached | grep -nE "sk-or-[A-Za-z0-9_-]{10,}|sk-ant-[A-Za-z0-9_-]{10,}|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}|GOOGLE_CLIENT_SECRET=[^ ]+"   # must print nothing
```
