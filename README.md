# TweakMind

TweakMind is an AI-assisted Windows Optimization Decision Tool.

Slogan: 让每一次 Windows 优化，都心里有数。

This repository currently contains the desktop application architecture only. It does not scan Windows, optimize settings, call Windows APIs, edit the registry, run AI, or apply system changes.

## Stack

- React
- TypeScript
- Tauri
- TailwindCSS
- React Router

## Application Structure

```text
tweakmind/
  src/
    app/
      router.tsx
    components/
      layout/
        AppLayout.tsx
        Sidebar.tsx
      page/
        PageTitle.tsx
    pages/
      DashboardPage.tsx
      ScanPage.tsx
      ReportPage.tsx
      DecisionPage.tsx
      HistoryPage.tsx
      SettingsPage.tsx
    styles/
      globals.css
    main.tsx
  src-tauri/
    src/main.rs
    tauri.conf.json
```

## Routes

- `/dashboard`
- `/scan`
- `/report`
- `/decision`
- `/history`
- `/settings`

Each route currently renders only its page title. This is intentional: Sprint architecture work should create stable extension points without adding product or platform logic.

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

Build the desktop app:

```bash
npm run tauri:build
```

## Current Boundaries

Do not implement these in this architecture sprint:

- Scanning
- Optimization
- Registry changes
- Windows API calls
- AI features
- Business logic

Future development should add those capabilities behind explicit modules, permissions, and user-confirmed flows.

## License

MIT
