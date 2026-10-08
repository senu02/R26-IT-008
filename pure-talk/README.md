# PureTalk frontend

This directory contains the Next.js frontend for PureTalk. The backend is in
`../puretalk_backend` and runs separately on port 8000 during development.

## Requirements

- Node.js 20 or newer
- npm (included with Node.js)
- A running PureTalk backend at `http://localhost:8000`

## Install and run

Open a terminal in this directory and run:

```powershell
npm install
npm run dev
```

Open `http://localhost:3000` in a browser. Keep the frontend terminal running.

The development command comes from the `scripts` section of `package.json`:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

Use `npm run build` to create a production build and `npm run start` to serve a
completed production build.

The frontend uses `http://localhost:8000` as its local backend by default. The
API service files also support `NEXT_PUBLIC_API_URL` when a different backend
address is required. Check each service's expected base path before setting
that variable because some services add `/api` themselves.

See the repository-level `README.md` for complete first-time setup and project
handoff instructions.
