import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getStandardsForBranch,
  readinessBand,
  readinessCoaching,
  standardsByBranch,
} from "./military-standards.ts";

describe("military standards intelligence", () => {
  it("returns the selected branch standard", () => {
    assert.equal(getStandardsForBranch("Marine Corps"), standardsByBranch["Marine Corps"]);
    assert.equal(getStandardsForBranch("Navy").assessment, "Physical Readiness Test");
  });

  it("falls back to Army standards for unknown branch values", () => {
    assert.equal(getStandardsForBranch("Merchant Marines"), standardsByBranch.Army);
  });

  it("classifies MVP readiness bands from push-up, plank, and run baselines", () => {
    assert.equal(readinessBand(45, 120, 900), "Ready");
    assert.equal(readinessBand(30, 90, 1080), "Passing");
    assert.equal(readinessBand(29, 90, 1080), "Needs work");
  });

  it("includes branch assessment context in coaching", () => {
    const coaching = readinessCoaching("No PT logged", "Air Force");

    assert.match(coaching, /Department of the Air Force Fitness Assessment/);
  });
});
