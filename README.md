# PrestaShop Registration — Playwright + TypeScript

Automated end-to-end tests for the **Register** functionality of the PrestaShop demo store ([demo.prestashop.com](https://demo.prestashop.com/)), built with Playwright and TypeScript using the Page Object Model.

## Prerequisites

- [Node.js](https://nodejs.org/) 20 or newer (developed on Node 22)
- Internet access (the tests run against the public demo store)

## Getting started

```bash
git clone https://github.com/ivadkid/prestashop-register-automation.git
cd prestashop-register-automation
npm install
npx playwright install chromium firefox
```

## Running the tests

```bash
npm test                 # full suite, Chromium + Firefox
npm run test:smoke       # only the @smoke test (successful registration)
npm run test:chromium    # full suite, Chromium only
npm run test:headed      # Chromium, one test at a time, with a visible browser window
npm run report           # open the HTML report of the last run
```

You can also run a single test by name, e.g. `npx playwright test -g "weak password"`, or step through the tests interactively with `npx playwright test --ui`.

After every run, an HTML report is written to `playwright-report/`. Failed tests include a screenshot, and a retried test also includes a full trace (DOM snapshots, network, console), viewable in the report.

> **Note:** the public demo store sometimes answers *502 Bad Gateway*. Each test is retried once, so this usually shows up only as a **flaky** test in the report. If a test still fails, its screenshot will show the 502 page; running the suite again a few minutes later normally passes. See [Handling an unreliable public demo](#design-decisions).

## Project structure

```
tests/
  register.spec.ts      The test scenarios: what is tested and what is expected
pages/
  RegisterPage.ts       Page object: locators + actions for the registration form
  Header.ts             Page object: the shop header (tells whether a customer is signed in)
fixtures/
  pages.ts              Custom fixtures: open a demo shop and hand ready page objects to tests
  test-data.ts          Test data builder (unique user per test) and invalid values
playwright.config.ts    Browsers, timeouts, retries, reporting
```

The layers have one job each: **tests** describe behaviour, **page objects** know *how* to interact with the page, **fixtures** handle setup, and **test data** lives in one place.

## What is tested, and why

The scenarios were chosen by **risk**: what would hurt the business or the customer most if it broke. The aim was to cover each important rule of the registration form once, not every field combination.

| # | Scenario | Why it matters | Key assertions |
|---|---|---|---|
| 1 | **Valid registration signs the customer in** `@smoke` | The core business flow: if it breaks, no new customers can sign up. | Leaves the registration page, "Sign out" link is visible, the customer's name is shown in the header |
| 2 | **An email that already has an account is rejected** | Data integrity: one email = one account. A duplicate would break login, password reset and order history. | "The email is already used" error under the email field; still on the form; not signed in |
| 3 | **A weak password is rejected by the password policy** | Security: the shop requires a password of strength "Strong". | Field reports "Your password is too weak", the "minimum score must be: Strong" rule is shown; submit doesn't create an account |
| 4 | **A first/last name containing digits is rejected** (data-driven, both fields) | Server-side validation of the customer's name, which is reused on invoices and delivery labels. | "Invalid format." error under the right field; still on the form; not signed in |
| 5 | **The form can't be submitted without accepting the terms** | Legal / GDPR: no account may be created without explicit consent. | Terms checkbox is reported as missing a required value; still on the form; not signed in |

**Every negative test checks two things:** the user sees the *right* error, and **no account was created** (still on the form, not signed in). Checking only the error message would miss a bug where the shop shows an error but creates the account anyway.

### Deliberately not automated

- **Optional fields** (social title, birthdate, newsletter / partner offers): they don't block registration, so they're lower risk.
- **Each empty required field / invalid email format**: these are enforced by standard HTML attributes (`required`, `type="email"`), i.e. by the browser rather than the shop. Scenario 5 already shows that this mechanism blocks submission. Testing every field would add tests without adding confidence.
- **Signing in with the newly created account later**: this would be the strongest proof that the account was really saved. However, on this demo, **signing in or out makes the whole demo shop instance get recycled**: it answers 502 and redirects to a brand-new store that doesn't have the account. This was investigated and is a limitation of the demo environment, not of the shop. In a real test environment this would be the next test to add.
- **Server-side check of the password policy**: the browser-side strength meter blocks a weak password before it reaches the server. Testing the server's own check would mean bypassing the UI (e.g. through an API call), which is outside the scope of UI tests.
- **Email confirmation, mobile layouts, accessibility, performance**: out of scope for this task.

## Design decisions

**Page Object Model.** Locators and actions live in `pages/`, so tests read like user steps (`registerPage.register(user)`). If the shop's markup changes, only the page object needs updating.

**Fixtures instead of `beforeEach`.** `fixtures/pages.ts` extends Playwright's `test` with ready-to-use objects. A test just asks for `registerPage` and receives one that is already on the registration form. Setup is declared once and reused, and each test only gets what it asks for.

**Finding the real shop behind demo.prestashop.com.** The demo homepage is a marketing page that loads the real shop inside an iframe, on a random subdomain created on demand (e.g. `cold-vase.demo.prestashop.com`). The `shopUrl` fixture waits for that iframe, reads its address, and navigates there directly. Tests then interact with the shop itself instead of reaching into an iframe. Each test gets its **own fresh shop instance**, so tests are fully isolated from each other and can run in parallel.

**Unique test data.** `createUniqueUser()` generates a new email for each test (timestamp + random number), so tests never conflict with each other or with earlier runs. Negative tests use overrides to break exactly one field, e.g. `createUniqueUser({ password: WEAK_PASSWORD })`, which makes the purpose of each test obvious.

**Duplicate-email test without "Sign out".** To come back as a new visitor after registering, the test deletes the shop's session cookie instead of clicking "Sign out", because signing out recycles the demo instance (see above).

**Locators.** Accessible roles and visible text (`getByRole('button', { name: 'Create account' })`) are preferred because they match what a user sees. Form inputs use their stable `id`s (`#field-email`), which PrestaShop generates from the field name.

**Handling an unreliable public demo.**
- Timeouts are more generous than Playwright's defaults, because every test starts a new demo instance.
- `RegisterPage.goto()` checks that the form really loaded. If the demo answers *502 Bad Gateway* (which happens occasionally), the test fails within seconds with a clear message, instead of a confusing timeout two minutes later.
- One retry per test. Playwright marks a test that only passed on retry as **flaky** in the report, so infrastructure problems stay visible instead of being hidden.
- Only two workers, to avoid overloading a shared public demo.

**Cross-browser.** Chromium and Firefox run by default. Other browsers (WebKit, Edge) can be enabled in `playwright.config.ts`.
