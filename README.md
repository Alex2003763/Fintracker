# Fintracker

A lightweight personal finance web app powered by AI Studio. Fintracker helps you track income and expenses, analyze trends, and generate customizable reports — all from a Next.js + TypeScript codebase.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Table of contents

- [Key features](#key-features)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting started (local development)](#getting-started-local-development)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [Deployment (Cloudflare Pages)](#deployment-cloudflare-pages)
- [Project structure](#project-structure)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Key features

- Real-time income and expense tracking
- Intelligent financial data analysis (AI-powered)
- Customizable report generation
- Clean UI with reusable components

## Tech stack

- TypeScript
- Next.js
- React
- (Optional) Cloudflare Pages for static deployments

## Prerequisites

- Node.js 14+ (LTS recommended)
- npm (or yarn)
- A valid Gemini API key (or other AI provider key, depending on integration)
- Git

## Getting started (local development)

1. Clone the repository
```bash
git clone https://github.com/Alex2003763/Fintracker.git
cd Fintracker
```

2. Install dependencies
```bash
npm install
# or
# yarn
```

3. Create a local environment file
Create a `.env.local` in the project root (see [Environment variables](#environment-variables)).

4. Start the development server
```bash
npm run dev
# or
# yarn dev
```

5. Open your browser to http://localhost:3000

## Environment variables

Store secrets in `.env.local` (this file should not be committed). Example:
```env
# Server-side only
GEMINI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx

# Example Next.js public var (exposed to the browser)
NEXT_PUBLIC_ANALYTICS_ID=UA-XXXXXXXX-X
```

Notes:
- Keep API keys and secrets out of version control.
- If you deploy to Cloudflare Pages, add the same variables to your Pages project settings.

## Available scripts

- `npm run dev` — Start Next.js in development mode (http://localhost:3000)
- `npm run build` — Build the project for production
- `npm run start` — Start the production server (after `build`)
- `npm run export` — Export a static site into the `out/` directory (if your app is compatible with `next export`)

Typical static export workflow (if applicable):
```bash
npm run build
npm run export
# output will be in ./out
```

If your app uses server-side features (API routes, SSR, or server-only AI calls), prefer a platform that supports Node.js or Next.js server runtime (Vercel, Cloudflare Pages with Functions, etc.).

## Deployment (Cloudflare Pages)

Option A — Static export (simple):
1. Ensure your app is compatible with `next export`.
2. Set the build command to:
```bash
npm run build && npm run export
```
3. Set the output directory to:
```
out
```
4. Add environment variables in the Cloudflare Pages dashboard (e.g., `GEMINI_API_KEY`).

Option B — Server-side / Functions (recommended if you rely on server-only functionality):
- Use a platform that supports Next.js server functions (Vercel provides full Next.js support). Cloudflare Pages supports Functions — check their documentation to configure Next.js with Pages Functions or use a custom adapter.

Cloudflare Pages tips:
- Add necessary environment variables in the Pages UI under "Settings > Environment Variables".
- If you need server-side runtime, enable Pages Functions or choose a server-capable deployment platform.

## Project structure

Fintracker/
├─ components/     # Reusable UI components (Buttons, Forms, Layouts)  
├─ pages/          # Next.js pages and API routes  
├─ public/         # Static assets (images, favicon)  
├─ styles/         # Global and component styles  
├─ .env.local      # Local env vars (not committed)  
└─ package.json    # Project scripts and dependencies

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a new branch named `feature/your-feature` or `fix/issue-description`.
3. Make your changes and add tests where appropriate.
4. Commit and push your branch.
5. Open a pull request describing the change and why it's needed.

Please follow:
- Clear, concise commit messages
- Consistent code style (run linters/formatters before submitting)
- Include tests or update existing ones for new behavior

If you'd like, open an issue first to discuss large features.

## Troubleshooting

- "Port 3000 already in use": change the port or stop the process that is using port 3000.
- Missing environment variables: ensure `.env.local` exists and values are set; restart the dev server after changing env vars.
- Build failures: run `npm run build` locally to reproduce and fix errors before deploying.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

If you'd like, I can:
- Add a CONTRIBUTING.md and PR template,
- Add CI workflow (GitHub Actions) to run lint/tests on PRs,
- Add badges (build, coverage) once CI is set up.
