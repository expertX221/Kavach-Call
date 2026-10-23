# Architecture and production path

The shipped application is a React 19 + Vite web prototype with local rule scoring. It has no server-side data collection, analytics, user accounts or external model calls.

## Data flow

Typed transcript or consented browser speech -> transient React state -> local rules -> signals and heuristic score -> verification -> optional report draft.

Contacts/questions are written to browser storage only on explicit save. Report summaries are in memory by default; local persistence is an opt-in setting. Excerpts are excluded from history. A downloaded report can include an edited excerpt only after human review.

Speech recognition is a browser capability. On-device-only mode sets `processLocally` when exposed; unsupported configurations fail closed. Provider mode requires separate consent and may send audio to that provider. Kavach creates no audio file.

The production service worker caches only the built static shell, bundled icons and fonts. It excludes API paths and never caches user input. First load and installation need a network. A new build uses a new cache name.

## Neon metadata, separated from family data

The connected Kavach-Call preview branch has additive tables for reviewed campaign and hostname metadata. Family questions, contacts and transcripts remain outside this database. The current public API is read-only; no public report upload or authentication workflow is implemented.

For a future authenticated reporting service, use the existing project, create an isolated development branch, and add versioned migrations. Start with minimal report metadata: authenticated reporter ID, campaign category, rule/model version, timestamp and an explicit consent record. Keep caller reputation private until independent corroboration and moderation. Introduce retention limits and an appeals path before publishing any number.

A server-side API must verify sessions, validate and bound input, rate-limit writes, use parameterized queries, and enforce per-user access. Keep DATABASE_URL server-only. Never prefix database credentials with VITE_. Do not expose a database connection directly to the browser. Pooled connections suit web requests; direct connections suit migrations.

Automatic trusted-contact messages require verified recipients, explicit opt-in, abuse protection, delivery status and a server-held provider credential. Practice mode must disable transmission at the server boundary too.

## Model work still required

A real clone detector needs trained weights, telephony-degraded evaluation data, calibrated output, consent and per-language/accent benchmarks. An arbitrary synthetic percentage would mislead users; this demo instead says voice authenticity was not analyzed.

Broader scam classification needs labeled normal and scam conversations, adversarial evaluation, acceptable false-positive thresholds, update/version management and low-confidence handling. Existing unit tests verify specified examples only and do not measure real-world accuracy.


## Intelligence extension
Vercel GET /api/intelligence reads only reviewed `kavach.campaigns` and `kavach.reputation` metadata from Neon. No audio, contact, family question or raw link payload is sent to this database. Optional ?host= performs a bounded registration lookup via IANA bootstrap, never the submitted website. Queries are parameterized, read-only, capped and time-limited. Empty feeds and outages have separate states. The browser service worker excludes API traffic. See README for schema and environment setup; all credentials remain server-side. The legacy Sites static worker serves the core UI only; these live endpoints require Vercel.
