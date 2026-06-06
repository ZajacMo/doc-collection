# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack "assignment collection system" (作业收集系统) — a web application for teachers to create assignments, collect student submissions, and manage users. Students upload files that are organized by assignment name.

- **Frontend**: Vue 3 + Element Plus + Vue Router + Axios + Vite (port 5173)
- **Backend**: Node.js + Express + SQLite3 + Multer (port 3001)
- **Deployment**: Docker + docker-compose

## Development Commands

Install dependencies first (run from project root):
```bash
npm install
cd client && npm install
```

Run both frontend and backend simultaneously:
```bash
npm run dev-all          # Concurrently runs backend (nodemon) + client (vite --host)
```

Run separately:
```bash
npm run dev-backend      # Backend only: nodemon server/index.js
npm run dev-client       # Frontend only: cd client && vite --host
```

Production build:
```bash
cd client && npm run build    # Output to client/dist/
```

Database migration (resets DB and imports seed data):
```bash
node server/db/migrate.js
```

Docker deployment:
```bash
docker-compose up --build
```

## High-Level Architecture

### Monorepo Structure
- `client/` — Vue 3 SPA, Vite dev server proxies `/api` and `/uploads` to `localhost:3001`
- `server/` — Express API with SQLite database and file upload handling
- Root `package.json` only has orchestration scripts; real dependencies are in each subfolder

### Nginx Caching (`client/nginx.conf`)
- `index.html` — no-cache headers (prevents stale SPA shells after deploy).
- JS/CSS — no-cache headers (development-friendly; update for production if needed).
- Images/fonts — 7-day `Cache-Control: public`.

### Database Layer (`server/db/`)
- `db.js` — Creates/opens a SQLite file at `server/db/database.db`. Exports `initDatabase()`, `getDb()`, `closeDb()`.
- `migrate.js` — Recreates tables, imports default users from `server/data/名单.xls` (if present), and seeds `assignments.json` / `submissions.json`.
- Controllers do NOT use an ORM. Each controller defines its own `query()`, `run()`, and `getOne()` wrappers that promisify `sqlite3` callbacks.

### Authentication
- No JWT. The frontend stores the user's `id` in `localStorage` as `token` after login.
- Every request sends `Authorization: Bearer {userId}`.
- In `server/index.js`, a lightweight middleware parses this header, looks up the user in SQLite, and injects `req.user`. There is no password hashing — passwords are compared directly to `studentId`.

### File Upload Architecture (Two-Step Flow)
1. **Upload file**: `POST /api/upload` with the file + `assignmentName`. Multer saves it to `uploads/{safeAssignmentName}/{studentName}-{studentId}.{ext}`. The server validates against the assignment's `fileTypes` and returns file metadata.
2. **Create submission**: `POST /api/submissions` with `fileName`, `filePath`, `fileSize`, etc. The controller inserts/updates the `submissions` row.

### Submission Status Model
- When an assignment is created, the backend auto-generates "Unsubmitted" placeholder records in `submissions` for every target student.
- When a student uploads, the placeholder row is updated to `status = 'submitted'`.
- The `getMissingSubmissions` endpoint queries students whose submission status is NOT `'submitted'`.

### Assignment Visibility
- The `assignments` table has a `relativeStudents` JSON column (array of `studentId` strings).
- If empty, all students see the assignment.
- If populated, only those students see it. Both `getAllAssignments` and `getAssignmentById` enforce this filter.

### Batch Download
- `GET /api/assignments/:id/download-all` uses the `archiver` library to stream a ZIP of all submitted files.
- It validates that every file on disk exists before starting the archive; if any are missing it returns `400` with details.

### File Type & Size Restrictions
- Each assignment stores allowed extensions in a `fileTypes` JSON column (e.g. `["pdf","docx"]`).
- Validated on upload (`uploadController.js`) and again on submission creation (`submissionController.js`).
- **Global max file size**: default 20MB, configurable via `MAX_FILE_SIZE` in `server/.env`.
- **Per-assignment max file size**: the `assignments` table has a `maxFileSize` column (INTEGER, MB). When creating or updating an assignment, admins can set a custom limit between 1–500MB. If unset, it falls back to the global `MAX_FILE_SIZE` value. The Multer global ceiling is 500MB to accommodate this.
- The upload endpoint reads `maxFileSize` from the assignment record and validates against it, returning `413` if exceeded.

### Environment Configuration
- `server/.env` controls `PORT`, `UPLOAD_DIR`, `DB_PATH`, `MAX_FILE_SIZE`, `COLLECTION_CYCLE`.
- The `DB_PATH` env var is used in `server/index.js` to `require()` the database module (it defaults to `./db/db`).

### Database Auto-Migration
- `db.js` includes `ensureSchema()` which runs at startup and adds missing columns (e.g. `password` on `users`, `maxFileSize` on `assignments`) via `ALTER TABLE`.
- `migrate.js` uses a `migrations` table to track applied migrations; each migration runs only once.

## Default Accounts (password = same as username/studentId)
- Admin: `admin` / `admin`
- Students: `2023001` / `2023001`, `2023002` / `2023002`, `2023003` / `2023003`
