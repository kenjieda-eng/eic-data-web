import { describe, expect, test } from "vitest";
import {
  issueToken,
  readBearerToken,
  validateToken,
} from "./api-auth";

const TEST_ENV = { API_AUTH_SECRET: "test-secret-at-least-16-chars-long" };

describe("issueToken", () => {
  test("issues a token with valid email + agreed terms", () => {
    const r = issueToken(
      { email: "user@example.com", agreedToTerms: true },
      TEST_ENV,
    );
    expect(r.ok).toBe(true);
    expect(r.token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    expect(r.expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(r.demo).toBe(false);
  });

  test("rejects when terms not agreed", () => {
    const r = issueToken(
      { email: "user@example.com", agreedToTerms: false },
      TEST_ENV,
    );
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Terms/);
  });

  test("rejects invalid email", () => {
    const r = issueToken(
      { email: "not-an-email", agreedToTerms: true },
      TEST_ENV,
    );
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/email/i);
  });

  test("returns demo:true when API_AUTH_SECRET missing", () => {
    const r = issueToken(
      { email: "x@y.co", agreedToTerms: true },
      {},
    );
    expect(r.ok).toBe(true);
    expect(r.demo).toBe(true);
  });
});

describe("validateToken", () => {
  test("validates an issued token round-trip", () => {
    const issued = issueToken(
      { email: "user@example.com", agreedToTerms: true },
      TEST_ENV,
    );
    const v = validateToken(issued.token!, TEST_ENV);
    expect(v.ok).toBe(true);
    expect(v.payload?.email).toBe("user@example.com");
    expect(v.payload?.scope).toBe("read");
  });

  test("rejects token signed with different secret", () => {
    const issued = issueToken(
      { email: "x@y.co", agreedToTerms: true },
      TEST_ENV,
    );
    const v = validateToken(issued.token!, { API_AUTH_SECRET: "different-secret-also-16-chars+" });
    expect(v.ok).toBe(false);
    expect(v.reason).toMatch(/Signature/);
  });

  test("rejects malformed token / non-string input", () => {
    expect(validateToken("not-a-token", TEST_ENV).ok).toBe(false);
    expect(validateToken(null, TEST_ENV).ok).toBe(false);
    expect(validateToken("a.b", TEST_ENV).ok).toBe(false);
  });

  test("rejects expired token", () => {
    const issued = issueToken(
      { email: "x@y.co", agreedToTerms: true, ttlSeconds: -10 },
      TEST_ENV,
    );
    const v = validateToken(issued.token!, TEST_ENV);
    expect(v.ok).toBe(false);
    expect(v.reason).toMatch(/expired/);
  });
});

describe("readBearerToken", () => {
  test("extracts token from Authorization: Bearer header", () => {
    const h = new Headers({ Authorization: "Bearer abc.def" });
    expect(readBearerToken(h)).toBe("abc.def");
  });

  test("returns null when no Authorization header", () => {
    expect(readBearerToken(new Headers())).toBeNull();
  });

  test("returns null when scheme is not Bearer", () => {
    const h = new Headers({ Authorization: "Basic xyz" });
    expect(readBearerToken(h)).toBeNull();
  });
});
