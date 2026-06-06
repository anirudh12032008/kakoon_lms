# Kokoon — Setup & Architecture

Kokoon is the LMS + block-based robotics editor. This repo is a **pnpm workspace**:

```
apps/lms        # React + Vite frontend (LMS dashboard + editor)
backend/api     # Express + MongoDB API (auth, courses, enrollment)
```

> The repo's package manager is **pnpm** (see `packageManager` in the root
> `package.json`). Use `pnpm`, not `npm`, to install — mixing the two reshuffles
> `node_modules` and can break the dev server.

---

## 1. Prerequisites

- Node 20+
- pnpm 9+  (`npm i -g pnpm`)
- MongoDB 7+ running locally — easiest via Docker:

```bash
docker compose -f backend/docker-compose.yml up -d   # starts mongo (+redis)
```

(If you don't use Docker, install MongoDB and make sure it listens on
`mongodb://127.0.0.1:27017`.)

---

## 2. Install

```bash
pnpm install
```

## 3. Configure the API

```bash
cp backend/api/.env.example backend/api/.env
# generate real JWT secrets:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Paste the generated values into `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`.
In development the server boots with safe defaults even without a `.env`, but you
should still set real secrets. In **production every secret is required** or the
process refuses to start.

## 4. Seed the courses

```bash
pnpm --filter api seed
```

Creates the four robot courses: **forklift, tank, turret, robotic-arm**.

## 5. Run

```bash
# terminal 1 — API on :4000
pnpm dev:api

# terminal 2 — frontend on :5173
pnpm dev
```

Open http://localhost:5173 → you'll be sent to **/login**. Create an account,
browse **/courses**, enroll for free, and click **Open Editor** to launch the
block editor pre-configured with that robot's blocks.

---

## API surface

| Method | Route                          | Auth | Purpose                            |
| ------ | ------------------------------ | ---- | ---------------------------------- |
| POST   | `/api/auth/register`           | —    | Create account                     |
| POST   | `/api/auth/login`              | —    | Sign in                            |
| POST   | `/api/auth/refresh`            | cookie | Rotate access token              |
| POST   | `/api/auth/logout`             | —    | Clear refresh cookie               |
| GET    | `/api/auth/me`                 | ✓    | Current user                       |
| GET    | `/api/courses`                 | opt  | List published courses             |
| GET    | `/api/courses/:slug`           | opt  | Course detail                      |
| GET    | `/api/enrollments`             | ✓    | My enrollments                     |
| POST   | `/api/enrollments/:slug`       | ✓    | Enroll (free, idempotent)          |
| POST   | `/api/enrollments/:slug/open`  | ✓    | Mark opened + return launch config |
| GET    | `/api/health`                  | —    | Health check                       |

### Auth model
- **Access token**: short-lived JWT (15m), kept in memory on the client, sent as
  `Authorization: Bearer`.
- **Refresh token**: long-lived JWT (30d) in an **httpOnly cookie**, rotated on
  every `/auth/refresh`. Invalidated via `tokenVersion` on the user.
- Passwords hashed with bcrypt (12 rounds). Auth endpoints are rate-limited.

---

## How courses drive the editor

Each `Course.launch` block mirrors the frontend's `EditorLaunchContext`
(`allowedCategories`, `allowedNodeTypes`, `availableSensors`, `mode`). When a
learner opens a course, the API returns this config, the client stores it
(`useLaunchStore`) and the editor opens showing exactly that course's blocks.

---

## Production hardening still recommended

This is a solid, working foundation. Before a public launch also add:

- Email verification + password reset flow
- HTTPS + secure cookie domain (`COOKIE_DOMAIN`, `secure: true`) behind a proxy
- A managed MongoDB (Atlas) and secrets manager for JWT secrets
- Refresh-token denylist in Redis for instant revocation (deps already present)
- Automated tests (Jest/Vitest + supertest) and CI
- Sentry DSN wired on both client and server (client dep already installed)
