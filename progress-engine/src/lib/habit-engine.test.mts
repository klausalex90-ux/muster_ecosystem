import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  currentHabitStreak,
  habitReadiness,
  isCompleteHabitDay,
  type HabitLog,
} from "./habit-engine.ts";

const complete = (date: string): HabitLog => ({
  date,
  nutrition: true,
  noExcuses: true,
  prep: true,
  pt: true,
});

describe("habit engine", () => {
  it("identifies complete habit days", () => {
    assert.equal(isCompleteHabitDay(complete("2026-06-26")), true);
    assert.equal(isCompleteHabitDay({ ...complete("2026-06-26"), nutrition: false }), false);
  });

  it("calculates the current complete-day streak", () => {
    const logs = [
      complete("2026-06-24"),
      complete("2026-06-25"),
      complete("2026-06-26"),
      complete("2026-06-20"),
    ];

    assert.equal(currentHabitStreak(logs, "2026-06-26"), 3);
  });

  it("returns locked-in readiness for a complete week", () => {
    const logs = [
      "2026-06-20",
      "2026-06-21",
      "2026-06-22",
      "2026-06-23",
      "2026-06-24",
      "2026-06-25",
      "2026-06-26",
    ].map(complete);
    const readiness = habitReadiness({
      logs,
      ptReadiness: "Ready",
      soreness: "low",
      today: "2026-06-26",
    });

    assert.equal(readiness.band, "Locked in");
    assert.equal(readiness.score, 100);
    assert.equal(readiness.weeklyCompleteDays, 7);
  });

  it("finds nutrition as the weak domain when meals are missed", () => {
    const logs = [
      complete("2026-06-24"),
      { ...complete("2026-06-25"), nutrition: false },
      { ...complete("2026-06-26"), nutrition: false },
    ];
    const readiness = habitReadiness({
      logs,
      ptReadiness: "Passing",
      soreness: "moderate",
      today: "2026-06-26",
    });

    assert.equal(readiness.weakDomain, "nutrition");
    assert.match(readiness.action, /meal/);
  });

  it("penalizes recovery when soreness is high", () => {
    const readiness = habitReadiness({
      logs: [complete("2026-06-26")],
      ptReadiness: "Ready",
      soreness: "high",
      today: "2026-06-26",
    });
    const recovery = readiness.domains.find((domain) => domain.domain === "recovery");

    assert.equal(recovery?.score, 45);
  });
});
