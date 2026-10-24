# Lili German backend

Small Cloudflare Workers + D1 API for at most five users. It uses invite-only registration, PBKDF2-SHA-256 passwords, hashed/revocable bearer sessions, an exact CORS allow-list, and optimistic state synchronization.

## Deploy

```bash
cp wrangler.toml.example wrangler.toml
npx wrangler d1 create lili-german
# Put the returned database_id in wrangler.toml.
npx wrangler secret put ADMIN_BOOTSTRAP_TOKEN
npm run db:migrate:remote
npm run deploy
```

Use a long, randomly generated bootstrap value. It is only accepted while the users table is empty. Do not put it in source control. After bootstrap, an admin creates one-use, 24-hour invite codes for the other four users.

For local development, apply the local migration and add a non-production secret in `.dev.vars` (ignored by Wrangler):

```bash
npm install
npm run db:migrate:local
npm run dev
```

## API

- `POST /auth/bootstrap` — header `X-Bootstrap-Token`; body `{username,password}`. First user only.
- `POST /auth/invites` — admin bearer token; returns a one-use code.
- `POST /auth/register` — body `{username,password,inviteCode}`.
- `POST /auth/login` — body `{username,password}`.
- `POST /auth/logout` — revokes the current bearer token.
- `GET /auth/me` — current user.
- `GET /sync/state` — current JSON state and version.
- `PUT /sync/state` — body `{baseVersion,state}`; stale versions return `409` with the current server state.

Passwords must be 12–200 characters; usernames are 3–32 ASCII letters, digits, `_`, `.`, or `-`. State is capped at 1 MB. Access tokens belong in memory or similarly protected client storage and should never be logged.

## Free-tier notes

This design fits comfortably in Workers and D1 free tiers for five learners. D1's database trigger is the final enforcement for the five-user cap. Keep the Worker and D1 in the same Cloudflare account, restrict `ALLOWED_ORIGINS`, and configure rate limiting for `/auth/login`, `/auth/register`, and `/auth/bootstrap` in Cloudflare before public launch.
