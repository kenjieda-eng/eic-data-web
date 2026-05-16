import { describe, expect, test } from "vitest";
import {
  buildEditorEmail,
  getInsightForNotification,
  parseRecipients,
  sendEditorNotification,
} from "./editor-notification";

describe("getInsightForNotification", () => {
  test("returns slug/title/updated for existing insight", () => {
    const out = getInsightForNotification("temp-vs-price");
    expect(out).not.toBeNull();
    expect(out?.slug).toBe("temp-vs-price");
    expect(out?.title.length).toBeGreaterThan(0);
    expect(out?.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("returns null for unknown slug", () => {
    expect(getInsightForNotification("non-existent-slug")).toBeNull();
  });
});

describe("parseRecipients", () => {
  test("splits csv, trims, drops empties", () => {
    expect(parseRecipients("a@x.co, b@y.co ,, c@z.co")).toEqual([
      "a@x.co",
      "b@y.co",
      "c@z.co",
    ]);
  });

  test("returns empty array for non-string", () => {
    expect(parseRecipients(undefined)).toEqual([]);
    expect(parseRecipients(null)).toEqual([]);
    expect(parseRecipients(123)).toEqual([]);
  });
});

describe("buildEditorEmail", () => {
  test("includes slug, index, and title in subject/text/html", () => {
    const mail = buildEditorEmail(
      { slug: "test-slug", title: "テスト Insight", updated: "2026-05-16" },
      42,
    );
    expect(mail.subject).toContain("#42");
    expect(mail.subject).toContain("テスト Insight");
    expect(mail.text).toContain("test-slug");
    expect(mail.html).toContain("test-slug");
  });
});

describe("sendEditorNotification", () => {
  test("returns sent:false when RESEND_API_KEY is missing", async () => {
    const res = await sendEditorNotification(
      { slug: "x", title: "T", updated: "2026-05-16" },
      1,
      {},
    );
    expect(res.sent).toBe(false);
    expect(res.reason).toMatch(/RESEND_API_KEY/);
  });

  test("returns sent:false when EDITOR_NOTIFY_TO is missing even with API key", async () => {
    const res = await sendEditorNotification(
      { slug: "x", title: "T", updated: "2026-05-16" },
      1,
      { RESEND_API_KEY: "test_key" },
    );
    expect(res.sent).toBe(false);
    expect(res.reason).toMatch(/EDITOR_NOTIFY_TO/);
  });
});
