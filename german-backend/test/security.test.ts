import { describe, expect, it } from "vitest";
import worker, { allowedOrigin } from "../src/index";
import { hashPassword, randomToken, sha256, verifyPassword } from "../src/security";

describe("password security", () => {
  it("hashes deterministically with its salt and rejects a wrong password", async () => {
    const result = await hashPassword("a-strong-password-123");
    expect(result.hash).not.toContain("a-strong-password");
    expect(result.iterations).toBeGreaterThanOrEqual(210_000);
    expect(await verifyPassword("a-strong-password-123", result.hash, result.salt, result.iterations)).toBe(true);
    expect(await verifyPassword("wrong-password", result.hash, result.salt, result.iterations)).toBe(false);
  });

  it("generates URL-safe random session tokens and hashes them", async () => {
    const a = randomToken();
    const b = randomToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(await sha256(a)).not.toBe(a);
  });
});

describe("request boundary", () => {
  const env = { ALLOWED_ORIGINS: "https://4mirgr.github.io,http://localhost:8788" } as never;
  it("allows only exact configured origins", () => {
    expect(allowedOrigin(new Request("https://api.test", { headers: { origin: "https://4mirgr.github.io" } }), env)).toBe("https://4mirgr.github.io");
    expect(allowedOrigin(new Request("https://api.test", { headers: { origin: "https://evil.test" } }), env)).toBeNull();
  });

  it("rejects a hostile browser origin before database access", async () => {
    const response = await worker.fetch(new Request("https://api.test/health", { headers: { origin: "https://evil.test" } }), env);
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "origin_not_allowed" });
  });

  it("serves health without database access", async () => {
    const response = await worker.fetch(new Request("https://api.test/health"), env);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});
