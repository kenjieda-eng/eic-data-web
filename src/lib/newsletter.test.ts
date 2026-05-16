import { describe, expect, test } from "vitest";
import {
  buildSubscription,
  buildWelcomeEmail,
  isValidEmail,
  sanitizeUtm,
  sendWelcomeEmail,
} from "./newsletter";

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
