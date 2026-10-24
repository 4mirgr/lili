import { hashPassword, randomToken, sha256, verifyPassword } from "./security";

export interface Env {
  DB: D1Database;
  ADMIN_BOOTSTRAP_TOKEN: string;
  ALLOWED_ORIGINS: string;
  SESSION_TTL_SECONDS?: string;
}

type User = { id: string; username: string; role: "admin" | "learner"; password_hash: string; password_salt: string; password_iterations: number };
type AuthUser = Pick<User, "id" | "username" | "role">;

const json = (data: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", ...headers } });

function allowedOrigin(request: Request, env: Env): string | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((v) => v.trim()).filter(Boolean);
  return allowed.includes(origin) ? origin : null;
}

function corsHeaders(request: Request, env: Env): HeadersInit {
  const origin = allowedOrigin(request, env);
  return origin ? {
    "access-control-allow-origin": origin,
    "access-control-allow-headers": "authorization, content-type, x-bootstrap-token",
    "access-control-allow-methods": "GET, POST, PUT, OPTIONS",
    "access-control-max-age": "86400",
    "vary": "Origin",
  } : {};
}

async function body(request: Request): Promise<Record<string, unknown>> {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 1_100_000) throw new Error("body_too_large");
  const parsed = await request.json();
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error("invalid_json");
  return parsed as Record<string, unknown>;
}

function validUsername(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9_.-]{3,32}$/.test(value);
}

async function createSession(env: Env, userId: string) {
  const token = randomToken();
  const now = Math.floor(Date.now() / 1000);
  const ttl = Math.min(Math.max(Number(env.SESSION_TTL_SECONDS || 2_592_000), 3600), 7_776_000);
  await env.DB.prepare("INSERT INTO sessions (id,user_id,token_hash,created_at,expires_at,last_seen_at) VALUES (?,?,?,?,?,?)")
    .bind(crypto.randomUUID(), userId, await sha256(token), now, now + ttl, now).run();
  return { token, expiresAt: now + ttl };
}

async function authenticate(request: Request, env: Env): Promise<AuthUser | null> {
  const match = request.headers.get("authorization")?.match(/^Bearer ([-_A-Za-z0-9]+)$/);
  if (!match) return null;
  const now = Math.floor(Date.now() / 1000);
  const user = await env.DB.prepare(`SELECT u.id,u.username,u.role FROM sessions s JOIN users u ON u.id=s.user_id
    WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>? AND u.disabled_at IS NULL`)
    .bind(await sha256(match[1]), now).first<AuthUser>();
  return user || null;
}

async function registerUser(env: Env, username: string, password: string, role: "admin" | "learner", inviteHash?: string) {
  const now = Math.floor(Date.now() / 1000);
  const secured = await hashPassword(password);
  const userId = crypto.randomUUID();
  if (inviteHash) {
    const invite = await env.DB.prepare("SELECT id FROM invites WHERE code_hash=? AND used_at IS NULL AND expires_at>?")
      .bind(inviteHash, now).first<{ id: string }>();
    if (!invite) throw new Error("invalid_invite");
    const result = await env.DB.batch([
      env.DB.prepare(`INSERT INTO users (id,username,password_hash,password_salt,password_iterations,role,created_at)
        SELECT ?,?,?,?,?,?,? FROM invites WHERE id=? AND code_hash=? AND used_at IS NULL AND expires_at>?`)
        .bind(userId, username, secured.hash, secured.salt, secured.iterations, role, now, invite.id, inviteHash, now),
      env.DB.prepare("INSERT INTO user_state (user_id,updated_at) VALUES (?,?)").bind(userId, now),
      env.DB.prepare("UPDATE invites SET used_at=?,used_by=? WHERE id=? AND used_at IS NULL").bind(now, userId, invite.id),
    ]);
    if (!result[2].meta.changes) throw new Error("invalid_invite");
  } else {
    await env.DB.batch([
      env.DB.prepare("INSERT INTO users (id,username,password_hash,password_salt,password_iterations,role,created_at) VALUES (?,?,?,?,?,?,?)")
        .bind(userId, username, secured.hash, secured.salt, secured.iterations, role, now),
      env.DB.prepare("INSERT INTO user_state (user_id,updated_at) VALUES (?,?)").bind(userId, now),
    ]);
  }
  return { id: userId, username, role };
}

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (request.method === "GET" && path === "/health") return json({ ok: true });

  if (request.method === "POST" && path === "/auth/bootstrap") {
    const supplied = request.headers.get("x-bootstrap-token") || "";
    if (!env.ADMIN_BOOTSTRAP_TOKEN || await sha256(supplied) !== await sha256(env.ADMIN_BOOTSTRAP_TOKEN)) return json({ error: "forbidden" }, 403);
    const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM users").first<{ count: number }>();
    if ((count?.count || 0) !== 0) return json({ error: "already_bootstrapped" }, 409);
    const data = await body(request);
    if (!validUsername(data.username) || typeof data.password !== "string") return json({ error: "invalid_credentials" }, 400);
    const user = await registerUser(env, data.username, data.password, "admin");
    return json({ user, ...(await createSession(env, user.id)) }, 201);
  }

  if (request.method === "POST" && path === "/auth/invites") {
    const admin = await authenticate(request, env);
    if (!admin || admin.role !== "admin") return json({ error: "forbidden" }, 403);
    const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM users").first<{ count: number }>();
    if ((count?.count || 0) >= 5) return json({ error: "user_limit_reached" }, 409);
    const code = randomToken(18);
    const now = Math.floor(Date.now() / 1000);
    await env.DB.prepare("INSERT INTO invites (id,code_hash,created_by,created_at,expires_at) VALUES (?,?,?,?,?)")
      .bind(crypto.randomUUID(), await sha256(code), admin.id, now, now + 86_400).run();
    return json({ inviteCode: code, expiresAt: now + 86_400 }, 201);
  }

  if (request.method === "POST" && path === "/auth/register") {
    const data = await body(request);
    if (!validUsername(data.username) || typeof data.password !== "string" || typeof data.inviteCode !== "string") return json({ error: "invalid_registration" }, 400);
    const user = await registerUser(env, data.username, data.password, "learner", await sha256(data.inviteCode));
    return json({ user, ...(await createSession(env, user.id)) }, 201);
  }

  if (request.method === "POST" && path === "/auth/login") {
    const data = await body(request);
    if (!validUsername(data.username) || typeof data.password !== "string") return json({ error: "invalid_credentials" }, 401);
    const user = await env.DB.prepare("SELECT id,username,role,password_hash,password_salt,password_iterations FROM users WHERE username=? AND disabled_at IS NULL")
      .bind(data.username).first<User>();
    if (!user || !(await verifyPassword(data.password, user.password_hash, user.password_salt, user.password_iterations))) return json({ error: "invalid_credentials" }, 401);
    const { password_hash: _h, password_salt: _s, password_iterations: _i, ...safe } = user;
    return json({ user: safe, ...(await createSession(env, user.id)) });
  }

  if (request.method === "POST" && path === "/auth/logout") {
    const match = request.headers.get("authorization")?.match(/^Bearer ([-_A-Za-z0-9]+)$/);
    if (match) await env.DB.prepare("UPDATE sessions SET revoked_at=? WHERE token_hash=? AND revoked_at IS NULL")
      .bind(Math.floor(Date.now() / 1000), await sha256(match[1])).run();
    return new Response(null, { status: 204 });
  }

  const user = await authenticate(request, env);
  if (!user) return json({ error: "unauthorized" }, 401);
  if (request.method === "GET" && path === "/auth/me") return json({ user });

  if (request.method === "GET" && path === "/sync/state") {
    const state = await env.DB.prepare("SELECT version,state_json,updated_at FROM user_state WHERE user_id=?").bind(user.id).first<{version:number;state_json:string;updated_at:number}>();
    return json({ version: state?.version || 0, state: JSON.parse(state?.state_json || "{}"), updatedAt: state?.updated_at || null });
  }

  if (request.method === "PUT" && path === "/sync/state") {
    const data = await body(request);
    if (!Number.isInteger(data.baseVersion) || typeof data.state !== "object" || data.state === null || Array.isArray(data.state)) return json({ error: "invalid_state" }, 400);
    const serialized = JSON.stringify(data.state);
    if (new TextEncoder().encode(serialized).byteLength > 1_000_000) return json({ error: "state_too_large" }, 413);
    const now = Math.floor(Date.now() / 1000);
    const result = await env.DB.prepare("UPDATE user_state SET state_json=?,version=version+1,updated_at=? WHERE user_id=? AND version=?")
      .bind(serialized, now, user.id, data.baseVersion).run();
    if (!result.meta.changes) {
      const current = await env.DB.prepare("SELECT version,state_json,updated_at FROM user_state WHERE user_id=?").bind(user.id).first<{version:number;state_json:string;updated_at:number}>();
      return json({ error: "version_conflict", current: { version: current?.version, state: JSON.parse(current?.state_json || "{}"), updatedAt: current?.updated_at } }, 409);
    }
    return json({ version: Number(data.baseVersion) + 1, updatedAt: now });
  }
  return json({ error: "not_found" }, 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(request, env);
    const origin = request.headers.get("origin");
    if (origin && !allowedOrigin(request, env)) return json({ error: "origin_not_allowed" }, 403);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    try {
      const response = await route(request, env);
      for (const [key, value] of Object.entries(cors)) response.headers.set(key, value);
      response.headers.set("cache-control", "no-store");
      response.headers.set("x-content-type-options", "nosniff");
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : "internal_error";
      if (["invalid_password", "invalid_json", "body_too_large", "invalid_invite"].includes(message)) return json({ error: message }, message === "invalid_invite" ? 403 : 400, cors);
      if (message.includes("UNIQUE")) return json({ error: "username_unavailable" }, 409, cors);
      if (message.includes("user_limit_reached")) return json({ error: "user_limit_reached" }, 409, cors);
      console.error(error);
      return json({ error: "internal_error" }, 500, cors);
    }
  },
};

export { allowedOrigin, corsHeaders };
