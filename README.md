# Circadia — Adaptive Study

**Offline-first. On-device. Timing-only.**  
*The first study tool that knows when you’re actually able to learn — not by asking you, but by noticing how you type.*

> Status: Draft · Date: August 21, 2026 · Stack: TanStack Start · React 19 · Express 5 · Dexie (IndexedDB) · SQLite (`node:sqlite`) · TanStack Charts

---

## Table of Contents

- [Vision](#vision)
- [Why Keyboard Timing](#why-keyboard-timing)
- [Core Loop](#core-loop)
- [Features](#features)
- [Architecture](#architecture)
- [Data Model](#data-model)
- [Design Principles](#design-principles)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Scripts](#scripts)
- [Offline & PWA](#offline--pwa)
- [Adaptive Engine (Detail)](#adaptive-engine-detail)
- [Privacy & Transparency](#privacy--transparency)
- [Sync Backend (Optional)](#sync-backend-optional)
- [Testing](#testing)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Contributing & Commits](#contributing--commits)
- [License](#license)

---

## Vision

Circadia is a spaced-repetition study application that pairs a standard **SM-2** scheduler with a real-time cognitive-load signal derived **passively from typing rhythm**. It changes *what* it shows — not just *when* — based on the learner’s inferred state in the moment.

- **Surface:** Import material, review it.
- **Underneath:** Silently builds a private, on-device baseline of normal typing rhythm. When that rhythm drifts — longer pauses, more corrections, slower WPM — it adapts: easier material first, a break sized from personal recovery history, hard topics routed toward empirically sharpest hours.

> *Nothing is self-reported. Nothing leaves the device. No subscription. No paid API.*

Target: **students** first — the people who most need to study when they’re least able — but architected for anyone doing repeated, focused keyboard work (certification prep, languages, professional study).

---

## Why Keyboard Timing

Physiological fatigue sensing (EEG, HRV, eye-tracking) is accurate in a lab and unusable in a dorm room at 11 pm. Typing rhythm carries a real, measurable fatigue signal — inter-key latency, dwell time, correction rate, and rolling WPM drift — with classification accuracy reported around 91% in recent literature, light enough for real-time use, and specifically named as a fit for education. Circadia treats the keyboard you already have as the sensor.

The decisive design choice is **personal-only**. Circadia never scores against a population model; it recalibrates against the same person’s own history via an exponentially weighted baseline, getting quieter and more accurate the longer it is used.

---

## Core Loop

1. **Import** — Paste plain text, Markdown, or JSON. Auto-segmented into atomic cards via heuristics (headers, bullets, `Q: / A:`, `::` / `->` delimiters) with manual edit before saving. Topic tagging + optional target date (exam) is the only deadline concept.
2. **Calibration (3–5 sessions)** — Standard SM-2 while a personal EWMA baseline builds. No adaptation; disclosed up front.
3. **Adaptive review** — Live per-minute timing features compared to the personal rolling baseline. Sustained deviation (>1.6σ for ≥3 minutes, 2+ features) flags elevated load.
4. **Adaptation** — Queue reorders toward high-confidence cards, break suggestion is *median historical recovery* (not a fixed timer), and peak-window scheduling is offered — all disclosed.
5. **Insight** — Local-only dashboard: retention by topic, session-length vs. performance (visual, not obsessive), and one plain-language actionable pattern.

If adaptive is off, or input is non-keyboard (swipe, screen reader, assistive device), Circadia runs as a complete, high-quality SM-2 app — a first-class mode, not a degraded afterthought.

---

## Features

### Content Import & Management
- Paste/import plain text, Markdown, or JSON; auto-segment heuristics, dedupe, editable preview.
- Manual card creation (front/back, topic, optional cloze, target date).
- Tagging by topic, searchable library, topic filter.
- Add / edit / delete with persistence across refreshes (IndexedDB).
- Export as JSON or Markdown — no lock-in.

### Adaptive Review Engine (core differentiator)
- **Signal capture:** `keydown`/`keyup` timing only. Listener resolves to `interKeyLatency`, `dwellTime`, `isCorrection`, `timestamp`; the `key` value is discarded synchronously and never stored.
- **Features stored:** Per-minute aggregated means (`interKeyLatency`, `dwellTime`, `correctionRate`, `wpm`) — numeric only.
- **Baseline v1 (ships first):** EWMA mean/variance/stddev per feature, α=0.15, updated after each session. Sustained z-score deviation → elevated load.
- **Baseline v2 (future):** Optional on-device TensorFlow.js classifier layered on top; additive, never required.
- **Actions:** Reorder queue to mastered material, suggest break (personal median, clamped 2–15 min), queue unlearned target-date material toward personal peak window, always disclose *why*.

### Insights Dashboard (landing page)
- Retention by topic (bar via **TanStack Charts**), session-length vs. performance buckets, actionable pattern (`accuracy on new cards drops after ~20m`), pipeline buckets (New / Learning / Review / Mastered) with expected mastery count.
- Recent activity feed and upcoming/overdue list.
- All figures are derived from the underlying data and update on refresh after grading or importing.

### Transparency & Privacy Controls
- One-tap panel: which features are measured, last 24 h of derived values (never raw), current baseline.
- Adaptive opt-in at first run (not opt-out).
- One-tap JSON export and one-tap full delete.
- Fully offline — works in airplane mode.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Client (required, fully offline)                        │
│  React 19 + TanStack Router + TanStack Query            │
│  Dexie 4 (IndexedDB) — single source of truth           │
│  Service Worker (vite-plugin-pwa / Workbox) — PWA       │
│  Signal module: plain TypeScript EWMA (zero deps)      │
│  TanStack Charts (retention + focus visualizations)      │
│  SM-2 scheduler, import heuristics, insight builders    │
├─────────────────────────────────────────────────────────┤
│  Sync Backend (optional, never required)                 │
│  Express 5 + node:sqlite (DatabaseSync) — SQLite file   │
│  Routes: /health, /sync/push, /sync/pull, /kv           │
│  If unreachable, core loop does not degrade — sync queues│
└─────────────────────────────────────────────────────────┘
```

- **No AI API** anywhere. The adaptive engine is classical, on-device, and free by construction.
- Time-to-interactive < ~1.5 s on mid-range device; capture never blocks input.
- IndexedDB is the source of truth; SQLite file (`data/circadia-sync.db`) is only for optional cross-device backup.

---

## Data Model (IndexedDB via Dexie)

| Store | Key | Fields |
|-------|-----|--------|
| `cards` | `id` | `front`, `back`, `topic`, `targetDate?`, `createdAt`, `interval`, `repetitions`, `easeFactor`, `dueDate`, `lastReviewed?` |
| `reviewSessions` | `id` | `cardId`, `sessionId`, `timestamp`, `grade` (0 Again · 1 Hard · 2 Good · 3 Easy), `durationMs?` |
| `baselineFeatures` | `name` | `mean`, `variance`, `stddev`, `sampleCount`, `lastUpdated` (one row per feature) |
| `sessionSignals` | `id` | `sessionId`, `minuteIndex`, `timestamp`, per-minute `interKeyLatency`, `dwellTime`, `correctionRate`, `wpm`, `zScores?` |
| `insights` | `id` | `statement`, `stat`, `timestamp`, `dismissed`, `kind` |
| `appSettings` | `key` | `value` (JSON) — `adaptiveOptIn`, `calibrationSessions`, `hasSeenOnboarding` |

SM-2 `q` mapping: `Again 0 → 0`, `Hard 1 → 3`, `Good 2 → 4`, `Easy 3 → 5`; `easeFactor` floored at 1.3.

---

## Design Principles

1. **Zero bloat** — Only `sense-state → adapt-review → surface-insight` ships.
2. **Offline-first, permanently** — Connectivity is an enhancement, never a dependency.
3. **Quiet by design** — Grand impact is the outcome (better retention, less grinding), not decoration.
4. **Your data trains only you** — Timing only, on-device only, visible and deletable on demand.

**Look & feel:** Minimalist, typographic, generous negative space, subtle micro-interactions. Palette: `amber #ecad0a`, `blue #209dd7`, `purple #753991` with cool grays. No background gradients, no purple backgrounds, no gradient buttons, no single-side accent borders — flat, sharp, professional.

---

## Tech Stack

All dependencies are **up-to-date as of August 2026** and open-source.

| Layer | Choice | Version (Aug 2026) |
|-------|--------|---------------------|
| App shell | TanStack Start | `^1.120.20` |
| Routing | TanStack Router | `^1.167.1` |
| Data fetching | TanStack Query | `^5.90.2` |
| Tables | TanStack Table | `^8.21.3` |
| Charts | TanStack Charts | `^0.14.0` |
| UI | React 19, Tailwind 4, lucide-react | `19.2.8`, `4.1.18` |
| Local DB | Dexie 4 (IndexedDB) | `^4.2.1` |
| Sync DB | Express 5 + `node:sqlite` (built-in) | `5.1.0` |
| ORM (server demo) | Drizzle ORM / Kit | `^0.45.1` |
| PWA | vite-plugin-pwa (Workbox) | `^1.0.4` |
| Build | Vite 8 + @vitejs/plugin-react | `8.2.2`, `6.1.0` |
| Tests | Vitest 4 + jsdom | `4.1.11`, `30.x` |

> Financial constraint met: zero hidden fees, zero paywalls, zero required paid hosting. The free tier is the unlimited tier.

---

## Project Structure

```
src/
  db/
    dexie.ts        # Dexie schema, types, settings helpers
    seed.ts         # Realistic sample data (seedIfEmpty)
  lib/
    sm2.ts          # Pure SM-2 + confidence scoring
    baseline.ts     # EWMA baseline + elevated detection + break/peak
    signals.ts      # Timing-only capture + per-minute aggregation
    adapt.ts        # Queue adaptation + buildQueue
    import.ts       # Auto-segment, JSON/Markdown import-export
    insights.ts     # Retention, focus curve, actionable pattern
    __tests__/      # Vitest suites
  hooks/
    useBaseline.ts
    useSignalCapture.ts
  components/
    Header.tsx      # Nav (Dashboard, Library, Review, Insights, Privacy)
    Footer.tsx
  routes/
    __root.tsx
    index.tsx       # Dashboard (landing)
    library.tsx     # Library + import/export + search/filter
    review.tsx      # Review + calibration banner + adaptation notice
    insights.tsx    # Detailed charts
    privacy.tsx     # Transparency & controls
  styles.css        # Minimalist grand tokens (flat, no banned elements)
server/
  index.ts          # Express + node:sqlite optional sync
public/
  favicon.ico, pwa-*.png
vite.config.ts      # TanStack Start + PWA + vitest env
```

---

## Getting Started

### Prerequisites

- Node.js `^24.18.0` (or `^22.10+`)
- npm `^11.16.0`

### One-command start (the only command a non-technical person needs)

```bash
npm install
npm run dev
```

Open `http://localhost:3000` — the app is pre-seeded and alive immediately.  
To reach it from the host when running inside the dev container, the server listens on `0.0.0.0:3000` (any `4900–4999` port may be used per workspace policy).

### Optional: run the sync backend alongside

```bash
npm run dev:all        # concurrently: Vite (3000) + Express sync (4901)
# or separately:
npm run dev            # app
npm run dev:sync       # sync → http://localhost:4901/health
```

The sync service stores `data/circadia-sync.db` (SQLite) and exposes:

- `GET /health`
- `POST /sync/push` `{ deviceId, kind, payload }`
- `GET /sync/pull?deviceId=&kind=`
- `POST /kv` / `GET /kv/:key`

It is **fully optional** — disconnect it and the review loop is unimpaired.

---

## Scripts

| Script | Purpose |
|--------|---------|
| `dev` | Vite dev server at `0.0.0.0:3000` |
| `dev:sync` | Express sync at `0.0.0.0:4901` |
| `dev:all` | Both concurrently |
| `build` | Production build (client + SSR) |
| `preview` | Preview production build |
| `test` / `test:watch` | Vitest (run / watch) |
| `lint` / `format` / `check` | ESLint + Prettier |
| `generate-routes` | Regenerate `src/routeTree.gen.ts` |
| `db:generate` / `db:push` etc. | Drizzle Kit (demo schema) |

---

## Offline & PWA

- IndexedDB via Dexie is the single source of truth; all core features work with zero network.
- `vite-plugin-pwa` registers a Workbox service worker (`autoUpdate`), caches `js/css/html/ico/svg/woff2`, and runtime-caches Google Fonts.
- Manifest: `name: Circadia — Adaptive Study`, `display: standalone`, theme `#0f172a`, background `#f8fafc`.
- Verify: `npm run build && npm run preview`, then toggle airplane mode — Library, Review, and Insights remain fully functional.

---

## Adaptive Engine (Detail)

### Capture

```ts
// src/lib/signals.ts — architectural guarantee
onKeyDown({ key, timeStamp }) {
  const isCorrection = key === 'Backspace' // only fact derived from key
  // key is then discarded; only { interKeyLatency, dwellTime, isCorrection, timestamp } is kept
}
```

- Listens to standard `keydown`/`keyup` already available to any web app — no permissions, no hardware.
- Only numeric deltas are stored; raw content never reaches storage.

### Baseline v1 (statistical, ships)

For each feature (`interKeyLatency`, `dwellTime`, `correctionRate`, `wpm`):

```
meanₙ = α·xₙ + (1-α)·meanₙ₋₁          α = 0.15
varₙ  = α·(xₙ-meanₙ₋₁)² + (1-α)·varₙ₋₁
z     = (x - mean) / stddev
```

- `interKeyLatency`, `dwellTime`, `correctionRate`: elevated if `z > 1.6`
- `wpm`: elevated if `z < -1.6` (inverted)
- Flag only if **≥2 features** exceed threshold for **3 consecutive minutes** — avoids single-blip false triggers.
- Requires `≥5` samples per feature before adaptation activates (cold start).

### Adaptation

```ts
// src/lib/adapt.ts
if (elevated && hasBaseline && optIn) {
  ordered = due.sort(byConfidenceDescending) // mastered first
  breakMinutes = median(historicalRecoveries) // clamped 2–15
  reason = "Your rhythm suggests elevated load — showing mastered material first."
}
```

- Break length is the **median minutes-to-baseline-recovery** after past breaks — personal, not generic.
- Peak window (v1.5): hour-of-day with smallest mean `|z|` (needs ≥5 samples/hour) — genuinely unlearned material for target-date topics is queued there.
- Every adaptation is disclosed in the Review UI with a dismissible banner.

### Graceful Degradation

User opts out, or input method yields no reliable timing → Circadia is a complete SM-2 scheduler. This is a first-class path, tested and documented as an accessibility requirement.

---

## Privacy & Transparency

Visit `/privacy`:

- Lists exactly which timing features are measured, in plain language.
- Shows the last 24 h of *derived* per-minute snapshots (IKL, dwell, correction rate, WPM) — never raw.
- Shows rolling baseline (mean, σ, n) per feature.
- `Export JSON` (all data) and `Delete all data` are one tap. No account, no cloud by default.

> *Not a keylogger. Not a clinical diagnostic. A practical “good time for hard material or not” signal, stated plainly.*

---

## Sync Backend (Optional)

```bash
SYNC_PORT=4901 SYNC_DB=./data/circadia-sync.db npm run dev:sync
```

- Express 5 + `node:sqlite` (`DatabaseSync`) — no native addon, no `better-sqlite3` build step.
- SQLite file lives locally; if unreachable, core loop does not degrade.
- Drizzle ORM is retained for the demo `todos` schema but is not required for sync — the sync service uses raw `node:sqlite` for minimalism.

---

## Testing

Vitest 4 + jsdom + globals.

```bash
npm run test         # run
npm run test:watch   # watch
```

Suites (`src/lib/__tests__`):

- `sm2.test.ts` — intervals, repetitions, ease floor (1.3), Hard/Good/Easy deltas, Won/Lost, due helpers, confidence.
- `baseline.test.ts` — EWMA updates, z-score, sustained elevated detection, break median clamping, peak window.
- `signals.test.ts` — aggregation, WPM/correction rate, and the architectural guarantee that `key` content is never stored.
- `import.test.ts` — header/topic split, Q/A, bullets, JSON, empty handling.
- `adapt.test.ts` — gating (opt-in, baseline, elevated), queue reordering toward high confidence, `buildQueue` caps.

All suites are synchronous and pure — they run offline, no network, no DB.

---

## Deployment

The build is fully static-capable (SSR via TanStack Start, client via Vite). No required environment variables for core use.

```bash
npm run build
npm run preview -- --host 0.0.0.0 --port 3000
```

To deploy the optional sync backend alongside, ensure `data/` is writable and expose `4901` (or any `4900–4999` per container policy).

---

## Roadmap

- **v1 (this release):** Import, SM-2 core, statistical EWMA baseline + adaptation, insights, full offline PWA, Express+SQLite sync backend. Zero ML dependency.
- **v1.5:** Personal peak-window scheduling (once enough history exists) — already scaffolded via `peakWindow`.
- **v2:** Optional on-device TensorFlow.js (WASM/WebGL) refinement layer, loaded lazily and only if user opts in.
- **v3:** Cross-device sync hardening.

Open questions tracked in code: cold start, individual variance, non-keyboard input, working-name trademark.

---

## Contributing & Commits

This repository follows **Conventional Commits** and atomic, revert-safe history.

```
type(scope): subject  # ≤50 chars, imperative, lower-case
# e.g. feat(scheduler): add SM-2 interval calc
#      fix(signals): clamp dwell to avoid overflow
#      test(baseline): assert sustained window
```

- One logical change per commit (if the message contains “and”, split it).
- Commit after a green test/manual check, after a schema migration, before switching branches, after refactors, or every ~45–60 min at a breaking point.
- Never commit `dist/`, `node_modules/`, or secrets; prefer `git add -p`.
- The current `node_modules` is a symlink to `/tmp/opencode/circadia-copy/node_modules` for overlay performance — do not commit the link target.

See `AGENTS.md` in the original harness for the full commit spec.

---

## License

MIT — do what helps people learn. If you fork for a different sensor or model, keep the timing-only, on-device, no-content guarantee — it’s architectural, not a policy promise.

---

<p align="center">
  <sub>Built with TanStack Start, React, Express, and TanStack Charts — offline-first, zero-cost, open-source only.</sub><br/>
  <sub>Circadia never says “you seem tired” based on someone else’s data. It learns <em>your</em> rhythm.</sub>
</p>
