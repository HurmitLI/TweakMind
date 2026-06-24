# TweakMind

TweakMind is an AI-assisted Windows optimization **decision tool**.

Slogan: Make every Windows optimization an informed decision.

This Beta build implements the full decision workflow for supported Windows optimizations:

**Knowledge → Scan → Decision → Apply → Verify → Recover → History**

TweakMind explains trade-offs, records changes, verifies results, and supports recovery. It does not auto-optimize or make decisions for you.

## Beta Scope

- **7 real-apply optimizations:** Windows Search, Game Mode, Core Isolation, Delivery Optimization, SysMain, HAGS, Power Plan
- **4 knowledge-only optimizations:** Background Apps, Startup Apps, Visual Effects, Windows Update Active Hours
- **Localization:** English and Chinese UI (knowledge bodies may remain English)
- **Platform:** Real apply/verify/recovery require the Tauri desktop app on Windows

See the in-app **About** page for version details and known limitations.

## Stack

- React 19 + TypeScript
- Tauri 2
- TailwindCSS
- React Router 7

## Project Structure

```text
src/
  app/router.tsx          # Routes
  pages/                  # Screen-level UI
  components/             # Shared UI
  core/                   # Scan, apply, verify, knowledge, localization
  styles/globals.css      # Design system
src-tauri/                # Native Windows executor (Rust)
docs/                     # LOCKED product and engineering docs
```

## Routes

| Route | Purpose |
|---|---|
| `/dashboard` | Home |
| `/scan` | System scan |
| `/report` | Decision report |
| `/knowledge` | Knowledge center |
| `/knowledge/detail` | Optimization detail |
| `/decision` | Decision support (alias) |
| `/confirm/:id` | Apply confirmation |
| `/apply` | Apply progress |
| `/verify` | Verification |
| `/recover/:historyId` | Recovery confirmation |
| `/recovery` | Recovery progress |
| `/history` | Optimization history |
| `/settings` | Preferences |
| `/about` | Release info and limitations |
| `/onboarding` | First-run experience |

## Development

Install dependencies:

```bash
npm install
```

Run the web frontend:

```bash
npm run dev
```

Run the Tauri desktop app:

```bash
npm run tauri:dev
```

Build the frontend:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

Build the desktop app:

```bash
npm run tauri:build
```

## Verification (Release)

```bash
npm run build
npm run lint
cd src-tauri && cargo check
npm run tauri build -- --debug --no-bundle
```

## Official Docs

- `docs/00_PROJECT_CONTEXT.md`
- `docs/01_PRODUCT_BIBLE.md`
- `docs/02_MVP_SPEC.md`
- `docs/03_PROJECT_STATUS.md`
- `docs/04_ENGINEERING_GUIDE.md`

## License

MIT
