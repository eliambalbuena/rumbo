# Rumbo

An AI scholarship research agent built for the Nebius × NVIDIA Global AI Hackathon. English UI, Next.js App Router, TypeScript and Tailwind CSS. Nemotron via Nebius Token Factory and Tavily official JavaScript SDK.

## Run locally

Requires Node.js 22+ and npm. All direct dependency versions are pinned to the installed package-lock.json versions; use npm ci for reproducible installs.

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Open http://localhost:3000. The default `USE_MOCKS=true` runs the entire workflow without API keys, network calls or credits. Six illustrative fixtures cover four institutional providers, a fictional agency and a fictional scam. All fixture dates, coverage and eligibility are demo data, not verified current scholarship calls. The two `.example` links deliberately do not resolve.

## Real APIs

Set these server-only variables in `.env`, then restart (and rebuild if using production):

```dotenv
USE_MOCKS=false
NEBIUS_BASE_URL=https://api.tokenfactory.nebius.com/v1/
NEBIUS_API_KEY=your-key
NEBIUS_MODEL=your-available-nvidia-nemotron-model-id
NEBIUS_MODEL_FAST=
NEBIUS_MODEL_SMART=
TAVILY_API_KEY=your-key
```

Choose an available NVIDIA Nemotron model ID from your Token Factory account. Do not use the illustrative model placeholder literally. Models must support Chat Completions. NEBIUS_MODEL_FAST is used by planQueries and scoreTrust; NEBIUS_MODEL_SMART is used by parseScholarships, checkEligibility and buildActionPlan. Each falls back independently to NEBIUS_MODEL when unset or blank. If both overrides are configured, NEBIUS_MODEL may be left empty. Select available Nemotron model IDs from your account. If the provider explicitly rejects response_format=json_object, Rumbo retries once without that parameter, strips <think> reasoning blocks, extracts JSON from surrounding prose or code fences and validates the result. Other errors are not retried via this compatibility path. Server logs record the model and reported prompt/completion/total tokens per request; failed requests or missing usage report unavailable/null. Cache hits make no model call and produce no usage log. The app uses the `openai` package with configurable `baseURL`, API key and model; output is validated with Zod. No credentials use `NEXT_PUBLIC_`.

Tavily uses `import { tavily } from '@tavily/core'`, `client.search(query, { searchDepth, maxResults })`, and `client.extract(urls, { extractDepth })`. Sources: https://docs.tavily.com/sdk/javascript/reference and https://dev.nebius.com/cookbook/first-agent-on-nebius.

## Commands

```powershell
npm test                 # deterministic agent tests; blocks network
npm run test:llm         # standalone API probe; skips network in mock mode
npm run test:search      # standalone search + extraction probe
npm run test:agent       # fake-provider tests for routing, JSON retry and AI-plan fallback
npm run typecheck
npm run test:e2e         # browser workflow; start server first
npm run build
npm start
```

For the first browser test run: `npx playwright install chromium`. End-to-end tests expect a server on localhost:3000 with `USE_MOCKS=true`.

## Flow and files

`types/index.ts` defines Profile, Scholarship, ActionPlan and streamed events with runtime request/output schemas. Profile.gpa stores the original grade and Profile.gpaScale stores 1-5, 1-10, 0-4, 0-100 or other. Other requires gpaScaleDescription. Bounds are validated per scale. The eligibility model receives the original value and scale and must explain any equivalence; ambiguous conversions stay almost. Citizenship starts empty; language input is normalized with comma + space; age is optional.

Each step lives in `lib/agent/`: planQueries → searchCandidates → extractPages → parseScholarships → scoreTrust → checkEligibility. `runResearch` orchestrates these six research stages; `buildActionPlan` runs on selection. Search planning uses 4–6 queries, search keeps up to eight distinct URLs, and page extraction bounds text sent to the LLM. Trust combines domain/payment/agency rules with an LLM assessment that can downgrade confidence. Parsed URLs must match extracted sources. Institutional domain signals do not prove authenticity. Eligibility remains `almost` when required facts cannot be confirmed.

`POST /api/research` accepts a Profile and returns newline-delimited JSON (`application/x-ndjson`): progress events `{type:"progress", step:0..5, message}`, then `{type:"result", scholarships, mock, warnings}` or an error event. Stream errors can occur after HTTP 200, so clients must consume events.

`POST /api/plan` accepts `{profile, scholarship}` and returns a suggested six-step backward timeline. Unknown or invalid deadlines yield undated steps. Past preparation dates are marked, never silently moved. In real mode, Nemotron (smart tier) proposes requirement-specific steps and conservative preparation estimates for passport issuance, document legalization/apostilles, certified translations, exam booking/sitting/results, references and submission. Estimates must be confirmed locally and are not official processing guarantees. The model returns integer days-before-deadline offsets; the server calculates dates backward from the validated deadline and marks expired dates using today (UTC). Missing deadlines remain undated. Mock mode uses the original six-step template. Any AI request, parsing or validation failure falls back to that same template with an explicit warning that its generic dates may not accommodate long procedures. Plans can spend LLM credits only in real mode.

`components/rumbo-app.tsx` provides home, results and plan screens, trust filters, expanded reasons, loading/error/empty states, keyboard focus and printable plans. `lib/copy.ts` centralizes core UI labels; remaining local UI text and agent output are English and can be extracted into locale dictionaries later.

## Cache and development limitations

Searches, extracted pages and validated LLM responses are cached in `.cache/` as JSON for 24 hours. Keys include query/input, task, model and endpoint (never API keys). Writes are atomic and cache failures do not stop the request. Remove `.cache/` to refresh. Cached model inputs may contain profile data; use a private local workspace and remove the cache when done. No profile database or browser persistence is used. Live queries and model calls transmit profile details to providers.

This is a local hackathon MVP: no authentication, billing quotas or distributed rate limiting. Add those before public deployment; APIs can consume credits in real mode. Node runtime and writable persistent disk are needed for reusable disk caching; ephemeral hosting can evict it. Budget hosting request duration for sequential LLM steps. Client progress shows completed stage changes, not fabricated percentages. Partial search failures can reduce coverage; failed extraction pages are reported as an incomplete result warning.

Web content is treated as untrusted model input. Basic public HTTPS URL filtering and exact source matching reduce accidental invalid URLs, but do not constitute comprehensive DNS/redirect SSRF protection. Tavily performs retrieval. Trust is an explained heuristic, not a fraud verdict. Always verify current eligibility, fees, deadline and timezone directly with the provider. Mock verification does not validate real credentials or live model compatibility.

## License

MIT — see LICENSE.

## Offer verification

Use “Got an offer? Check it” to paste a public HTTPS URL or offer text (10–12,000 characters). POST /api/verify accepts `{offer}`. Live mode extracts URLs with Tavily, identifies the organization and award with the smart model, searches for complaints/reviews and official scholarship evidence, then assesses service sales, payments, guarantees and corroboration. Only actually retrieved source URLs are returned. Search failures are disclosed; incomplete evidence cannot get green. Complaints are allegations, not proof. Mock mode provides trusted and scam examples and never calls APIs; other input gets an explicit unverified result. Remove personal information before checking an offer.

Research progress events optionally include `detail: {kind: "query" | "domain", value: string}`. Query events are emitted immediately before search calls and domain events before page extraction, including cache/mock reads. The profile screen shows this activity live alongside the current stage.
