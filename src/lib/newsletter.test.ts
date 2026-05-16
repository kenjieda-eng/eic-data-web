import { describe, expect, test } from "vitest";
import {
  buildConfirmEmail,
  buildConfirmEmailLinks,
  buildSubscription,
  buildWelcomeEmail,
  generateToken,
  isValidEmail,
  sanitizeUtm,
  sendConfirmEmail,
  sendWelcomeEmail,
  verifyToken,
} from "./newsletter";

const TEST_ENV = {
  NEWSLETTER_SECRET: "test-newsletter-secret-16chars+",
  NEWSLETTER_BASE_URL: "https://test.eic-jp.org",
};

describe("isValidEmail", () => {
  test("accepts standard email", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("a.b+tag@sub.example.co.jp")).toBe(true);
  });

  test("rejects invalid forms / non-strings / overflows", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("missing@tld")).toBe(false);
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(123)).toBe(false);
    expect(isValidEmail("a".repeat(250) + "@b.co")).toBe(false);
  });
});

describe("sanitizeUtm", () => {
  test("extracts only known UTM keys with string values <= 100 chars", () => {
    const out = sanitizeUtm({
      source: "top-hero",
      medium: "web",
      campaign: "weekly-newsletter",
      garbage: "ignore-me",
    });
    expect(out).toEqual({
      source: "top-hero",
      medium: "web",
      campaign: "weekly-newsletter",
    });
  });

  test("returns empty object for non-object input or oversized values", () => {
    expect(sanitizeUtm(null)).toEqual({});
    expect(sanitizeUtm("string")).toEqual({});
    expect(sanitizeUtm({ source: 123 })).toEqual({});
    expect(sanitizeUtm({ source: "a".repeat(101) })).toEqual({});
  });
});

describe("buildSubscription", () => {
  test("normalizes email to lowercase + trim, defaults UTM to {}", () => {
    const sub = buildSubscription({ email: "  USER@Example.COM  " });
    expect(sub.email).toBe("user@example.com");
    expect(sub.utm).toEqual({});
    expect(sub.subscribedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test("preserves passed UTM", () => {
    const sub = buildSubscription({
      email: "x@y.co",
      utm: { source: "insight-footer" },
    });
    expect(sub.utm).toEqual({ source: "insight-footer" });
  });
});

describe("buildWelcomeEmail", () => {
  test("includes the email in subject/html/text", () => {
    const sub = buildSubscription({ email: "hi@example.com" });
    const mail = buildWelcomeEmail(sub);
    expect(mail.subject).toContain("EIC Data");
    expect(mail.html).toContain("hi@example.com");
    expect(mail.text).toContain("hi@example.com");
  });
});

describe("sendWelcomeEmail", () => {
  test("returns sent: false when RESEND_API_KEY is missing", async () => {
    const sub = buildSubscription({ email: "x@y.co" });
    const res = await sendWelcomeEmail(sub, {});
    expect(res.sent).toBe(false);
    expect(res.reason).toMatch(/RESEND_API_KEY/);
  });
});

describe("generateToken / verifyToken (Day 5 午後第 5 弾)", () => {
  test("round-trip: confirm token は同じ secret で復元できる", () => {
    const token = generateToken("user@example.com", "confirm", TEST_ENV);
    const v = verifyToken(token, "confirm", TEST_ENV);
    expect(v.ok).toBe(true);
    expect(v.payload?.email).toBe("user@example.com");
    expect(v.payload?.action).toBe("confirm");
  });

  test("round-trip: unsubscribe token も同様", () => {
    const token = generateToken("x@y.co", "unsubscribe", TEST_ENV);
    const v = verifyToken(token, "unsubscribe", TEST_ENV);
    expect(v.ok).toBe(true);
    expect(v.payload?.action).toBe("unsubscribe");
  });

  test("wrong action: confirm token を unsubscribe として検証すると拒否", () => {
    const token = generateToken("x@y.co", "confirm", TEST_ENV);
    const v = verifyToken(token, "unsubscribe", TEST_ENV);
    expect(v.ok).toBe(false);
    expect(v.reason).toMatch(/Wrong action/);
  });

  test("expired: TTL 負数 → 即座に expired", () => {
    const token = generateToken("x@y.co", "confirm", TEST_ENV, -10);
    const v = verifyToken(token, "confirm", TEST_ENV);
    expect(v.ok).toBe(false);
    expect(v.reason).toMatch(/expired/);
  });

  test("malformed: 形式不正で reason 返却", () => {
    expect(verifyToken("not-a-token", "confirm", TEST_ENV).ok).toBe(false);
    expect(verifyToken(null, "confirm", TEST_ENV).ok).toBe(false);
    expect(verifyToken("a.b", "confirm", TEST_ENV).ok).toBe(false);
  });

  test("signature mismatch: 異なる secret で署名された token を拒否", () => {
    const token = generateToken("x@y.co", "confirm", TEST_ENV);
    const v = verifyToken(token, "confirm", {
      NEWSLETTER_SECRET: "different-secret-also-16chars+",
    });
    expect(v.ok).toBe(false);
    expect(v.reason).toMatch(/Signature/);
  });
});

describe("buildConfirmEmailLinks", () => {
  test("生成された URL は base + path + encoded token", () => {
    const links = buildConfirmEmailLinks("user@example.com", TEST_ENV);
    expect(links.confirmUrl.startsWith("https://test.eic-jp.org/api/newsletter/confirm?token=")).toBe(true);
    expect(links.unsubscribeUrl.startsWith("https://test.eic-jp.org/api/newsletter/unsubscribe?token=")).toBe(true);
  });

  test("trailing slash は剥がされる", () => {
    const links = buildConfirmEmailLinks("user@example.com", {
      ...TEST_ENV,
      NEWSLETTER_BASE_URL: "https://test.eic-jp.org///",
    });
    expect(links.confirmUrl.startsWith("https://test.eic-jp.org/api/newsletter/confirm?token=")).toBe(true);
  });
});

describe("buildConfirmEmail", () => {
  test("subject + html + text に email と両 link が含まれる", () => {
    const email = "hello@example.com";
    const links = buildConfirmEmailLinks(email, TEST_ENV);
    const mail = buildConfirmEmail(email, links);
    expect(mail.subject).toContain("EIC Data");
    expect(mail.subject).toContain("購読確認");
    expect(mail.text).toContain(email);
    expect(mail.text).toContain(links.confirmUrl);
    expect(mail.text).toContain(links.unsubscribeUrl);
    expect(mail.html).toContain(links.confirmUrl);
    expect(mail.html).toContain(links.unsubscribeUrl);
  });
});

describe("sendConfirmEmail", () => {
  test("returns sent:false when RESEND_API_KEY is missing", async () => {
    const sub = buildSubscription({ email: "x@y.co" });
    const res = await sendConfirmEmail(sub, {});
    expect(res.sent).toBe(false);
    expect(res.reason).toMatch(/RESEND_API_KEY/);
  });
});
