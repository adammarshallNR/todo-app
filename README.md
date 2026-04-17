# Playwright OpenTelemetry Reference

A reference implementation for instrumenting Playwright E2E tests with OpenTelemetry and shipping trace data to New Relic via GitHub Actions.

The application under test is a simple React todo app — the app itself is not the point. The focus is on the observability wiring around the test suite.

---

## What this demonstrates

- A custom Playwright [Reporter](https://playwright.dev/docs/api-class-reporter) that creates OpenTelemetry spans for every test and step
- A `globalSetup` file that initialises the OTel SDK before tests run and flushes it cleanly after
- A GitHub Actions workflow that builds, deploys, and runs the test suite in a single pipeline so all jobs appear as one trace group in New Relic
- The `newrelic-experimental/gha-new-relic-exporter` action that enriches those traces with GitHub Actions metadata

---

## Trace structure

```
playwright-test-suite  (root span — one per run)
└── <suite> > <test>   (one span per test)
    └── Step: ...      (one span per Playwright step)
```

Spans carry semantic attributes from the [OpenTelemetry semantic conventions](https://opentelemetry.io/docs/specs/semconv/):

| Attribute | Value |
|---|---|
| `test.case.name` | `<suite> > <test title>` |
| `test.case.result.status` | `pass` / `fail` |
| `test.suite.name` | suite title |
| `code.filepath` | path to the test file |
| `code.lineno` / `code.column` | test location |
| `browser.name` | chromium / firefox / webkit |
| `test.retry` | retry attempt number |
| `test.flaky` | `true` if passed on a retry |

W3C Trace Context (`TRACEPARENT` env var) is supported for linking runs to an upstream pipeline span.

---

## Key files

| File | Purpose |
|---|---|
| `global-setup.ts` | Starts the OTel SDK before all tests; shuts it down and flushes spans afterwards |
| `otel-reporter.ts` | Custom Playwright reporter — creates suite/test/step spans |
| `playwright.config.ts` | Wires up `globalSetup` and the custom reporter |
| `.github/workflows/main.yaml` | CI pipeline: build → upload to S3 → run Playwright tests |
| `.github/workflows/new-relic-exporter.yaml` | Exports GitHub Actions run metadata to New Relic |
| `tests/basic.test.ts` | Example test suite (includes intentional failures to validate error reporting) |

---

## GitHub Actions pipeline

The workflow in `main.yaml` has two jobs:

```
build  ──►  test
```

**`build`** — installs dependencies, builds the React app, syncs to S3, and uploads the build as a GitHub artifact.

**`test`** — downloads the build artifact, installs Playwright browsers, runs the test suite, and uploads the HTML report.

Both jobs run under the same workflow name, so `new-relic-exporter.yaml` (which fires once per completed workflow) produces a single trace group in New Relic rather than one per job.

---

## Required GitHub secrets

| Secret | Used by |
|---|---|
| `NEW_RELIC_LICENSE_KEY` | OTel exporter in `global-setup.ts` |
| `SQUAD_OWNER` | Attached as `squad.owner` resource attribute |
| `AWS_S3_BUCKET` | S3 sync in the build job |
| `AWS_ACCESS_KEY_ID` | S3 authentication |
| `AWS_SECRET_ACCESS_KEY` | S3 authentication |

The New Relic OTLP endpoint is set to the EU region (`otlp.eu01.nr-data.net`). Change it to `otlp.nr-data.net` in `global-setup.ts` for US accounts.

---

## Adapting for your own project

1. **Copy the three observability files** into your repo:
   - `global-setup.ts`
   - `otel-reporter.ts`
   - `playwright.config.ts` (or merge the relevant settings)

2. **Install the dependencies:**
   ```bash
   npm install --save-dev \
     @opentelemetry/sdk-node \
     @opentelemetry/exporter-trace-otlp-http \
     @opentelemetry/api
   ```

3. **Update `playwright.config.ts`** to point at your own `baseURL` and web server command.

4. **Add the GitHub secrets** listed above to your repository.

5. **Add `new-relic-exporter.yaml`** to your `.github/workflows/` directory as-is — it requires no changes.

6. **Ensure your test job is in the same workflow as your build/deploy jobs** so they all appear under one trace group.

---

## Running locally

```bash
npm install
npm run build
npx playwright test
```

The OTel exporter will no-op if `NEW_RELIC_LICENSE_KEY` is not set — tests will still run and results will appear in the local HTML report (`playwright-report/index.html`).

---

## Intentional test failures

`tests/basic.test.ts` includes two tests that are designed to fail:

- `FAILING — expects wrong title`
- `FAILING — expects non-existent element`

These exist to verify that failure data flows correctly through to New Relic. The workflow uses `npx playwright test || true` so CI does not block on them.

---

## License

This project is licensed under the Apache 2.0 License.

>This project also uses source code from third-party libraries. You can find full details on which libraries are used and the terms under which they are licensed in the third-party notices document.
