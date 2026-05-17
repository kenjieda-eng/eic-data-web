import { afterEach, describe, expect, it } from "vitest";
import {
  USAGE_BUCKETS,
  _resetUsageCounters,
  bumpUsage,
  getUsageSnapshot,
  isValidBucket,
} from "./usage-stats";

describe("usage-stats", () => {
  afterEach(() => {
    _resetUsageCounters();
  });

  it("starts every bucket at zero", () => {
    const s = getUsageSnapshot();
    expect(s.counts.apiReq).toBe(0);
    expect(s.counts.csvDl).toBe(0);
    expect(s.counts.citeCopy).toBe(0);
    expect(s.persistent).toBe(false);
  });

  it("bumpUsage increments the correct bucket", () => {
    bumpUsage("apiReq");
    bumpUsage("apiReq");
    bumpUsage("citeCopy");
    const s = getUsageSnapshot();
    expect(s.counts.apiReq).toBe(2);
    expect(s.counts.citeCopy).toBe(1);
    expect(s.counts.csvDl).toBe(0);
  });

  it("month key is in JST YYYY-MM regardless of UTC midnight", () => {
    // JST 2026-05-01 00:30 ≈ UTC 2026-04-30 15:30
    const utcLateApril = new Date("2026-04-30T15:30:00Z");
    bumpUsage("csvDl", utcLateApril);
    const s = getUsageSnapshot(utcLateApril);
    expect(s.month).toBe("2026-05");
    expect(s.counts.csvDl).toBe(1);
  });

  it("isolates counters across months", () => {
    bumpUsage("apiReq", new Date("2026-05-15T03:00:00Z"));
    const may = getUsageSnapshot(new Date("2026-05-15T03:00:00Z"));
    const june = getUsageSnapshot(new Date("2026-06-01T03:00:00Z"));
    expect(may.counts.apiReq).toBe(1);
    expect(june.counts.apiReq).toBe(0);
  });

  it("USAGE_BUCKETS lists exactly the three known buckets", () => {
    expect([...USAGE_BUCKETS].sort()).toEqual(["apiReq", "citeCopy", "csvDl"]);
  });

  it("isValidBucket accepts the three known names and rejects others", () => {
    expect(isValidBucket("apiReq")).toBe(true);
    expect(isValidBucket("csvDl")).toBe(true);
    expect(isValidBucket("citeCopy")).toBe(true);
    expect(isValidBucket("APIReq")).toBe(false);
    expect(isValidBucket("")).toBe(false);
    expect(isValidBucket(null)).toBe(false);
    expect(isValidBucket(123)).toBe(false);
  });
});
