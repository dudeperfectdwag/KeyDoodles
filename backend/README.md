# Offline Type Racing (Local)

A local-only typing race game inspired by TypeRacer. Choose from 60 cars and 10 airplanes, race against AI bots, and enjoy a slick UI served by Flask.

## Features
- Offline races vs adaptive AI bots
- 60 cars + 10 airplanes catalog
- Difficulty presets and passages
- Animated track, live progress updates
- SQLite persistence of races and participants

## Run (Windows PowerShell)

```powershell
# Create and activate venv
python -m venv .venv; .\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start server
python app.py
```

Open http://127.0.0.1:5000 in your browser.

## Notes
- No internet required after dependencies are installed.
- Frontend is served from Flask `templates` and `static` folders.
- Race state is polled every ~300ms for simplicity.
