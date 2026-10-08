# PureTalk

PureTalk is a social platform with a Next.js frontend and Django REST backend.
Its moderation features include text toxicity detection, audio transcription
and toxicity analysis, screen-text OCR for videos, extracted-video-audio
analysis, image moderation, behavior monitoring, and adaptive shielding.

## Project layout

- `pure-talk/` — Next.js frontend.
- `puretalk_backend/` — Django REST API, SQLite database, media, model files,
  and backend tests.
- `docs/` — implementation, research, reliability, and video-scan notes.

## What to include when sharing a ZIP

Keep the source code, `package.json`, `package-lock.json`, backend
`requirements.txt`, model files, migrations, documentation, and any database or
media that the teammate is expected to use. The current `db.sqlite3` contains
the current local data, so remove it only if the recipient should start without
that data.

The generated directories `pure-talk/node_modules`, `pure-talk/.next`, and the
root `venv` do not need to be included. They are machine-specific and can be
recreated with the commands below. Do not send private production secrets in
`.env` files.

## First-time setup on Windows

Install these tools first:

- Python 3.11 (the project has been run with Python 3.11.9).
- Node.js 20 or newer (the project has been run with Node.js 22).
- Git is optional when the project is received as a ZIP.

Extract the ZIP, open PowerShell in the extracted project root, and create the
backend environment:

```powershell
cd puretalk_backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python manage.py prepare_video_scan
python manage.py check
python manage.py runserver
```

If PowerShell blocks virtual-environment activation, use Command Prompt and run
`.venv\Scripts\activate.bat`, or run the environment's Python directly:

```powershell
.\.venv\Scripts\python.exe manage.py runserver
```

Leave that terminal open. The API will be available at
`http://localhost:8000`.

Open a second terminal in the project root and start the frontend:

```powershell
cd pure-talk
npm install
npm run dev
```

Open `http://localhost:3000` in a browser.

The first OCR, Whisper, or speech-emotion request may take longer if a library
needs to initialize or obtain a pretrained model. Internet access may therefore
be needed during dependency installation and first model use.

## Database notes

This ZIP includes an existing SQLite database and a recorded historical video
migration whose original migration file is absent. For this checkout, use:

```powershell
python manage.py prepare_video_scan
```

That command is safe to run more than once and prepares only the additive video
scan storage. Do not replace it with a blanket migration repair or delete the
database when the existing team data must be preserved. For a separately
created clean database with a complete migration history, the normal Django
command is `python manage.py migrate`.

## How to discover the startup command in another project

Start by reading the root `README.md`, then identify the framework from its
entry files:

| File found | Likely project | Where the command comes from |
| --- | --- | --- |
| `manage.py` | Django | Run `python manage.py help`; `runserver` is Django's development-server command. |
| `package.json` | Node/Next.js/React | Read its `scripts` object, then run a named script such as `npm run dev`. |
| `pyproject.toml` | Modern Python project | Read `[project.scripts]` and the framework dependency. |
| `requirements.txt` plus `app.py` | Flask or another Python app | Inspect imports and README; Flask commonly uses `flask --app app run`. |
| `main.py` importing FastAPI | FastAPI | Find the FastAPI object name; a common command is `uvicorn main:app --reload`. |
| `docker-compose.yml` or `compose.yml` | Containerized project | Read its `services` and use the documented `docker compose up`. |
| `Makefile` | Project-defined tasks | Run `make help` when provided or inspect named targets. |

For this backend, `manage.py` sets `DJANGO_SETTINGS_MODULE` to
`puretalk_backend.settings` and passes commands to Django. Running
`python manage.py help` lists every available command, and
`python manage.py help runserver` explains the exact server command and its
options. That is how `python manage.py runserver` can be confirmed from the
project itself instead of memorized.

For this frontend, `pure-talk/package.json` contains
`"dev": "next dev"`, so npm exposes it as `npm run dev`. In Node projects,
`npm run` lists the scripts the project author made available.

## Technical documentation

- `docs/TOXICITY_RESEARCH_STATUS_AND_VIDEO_SCOPE.md` describes the text,
  audio, and video research design, limitations, and evaluation requirements.
- `docs/VIDEO_TEXT_AUDIO_SCAN.md` documents the combined video screen-text and
  audio scan, decision contract, API, and focused tests.
