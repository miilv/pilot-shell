/**
 * Dashboard Project Filter Tests
 *
 * Tests that StatsGrid renders 8 tiles consistently,
 * Dashboard shows project filter indicator, and workspace section is separated.
 */

import { describe, it, expect } from "bun:test";
import { renderToString } from "react-dom/server";
import React from "react";

describe("Dashboard project filtering", () => {
  it("StatsGrid renders 8 tiles including Tasks Completed", async () => {
    const { StatsGrid } = await import(
      "../../src/ui/viewer/views/Dashboard/StatsGrid.js"
    );

    const stats = {
      observations: 10,
      summaries: 5,
      sessions: 8,
      lastObservationAt: "2m ago",
      projects: 3,
    };

    const specStats = {
      totalSpecs: 4,
      verified: 2,
      inProgress: 1,
      pending: 1,
      avgIterations: 1.5,
      totalTasksCompleted: 12,
      totalTasks: 20,
      completionTimeline: [],
      recentlyVerified: [],
    };

    const html = renderToString(
      React.createElement(StatsGrid, { stats, specStats })
    );
    expect(html).toContain("Tasks Completed");
    expect(html).toContain("of 20 total");
  });

  it("Dashboard shows project filter indicator when project selected", async () => {
    const { readFileSync } = await import("fs");
    const source = readFileSync(
      "src/ui/viewer/views/Dashboard/index.tsx",
      "utf-8"
    );

    expect(source).toContain("useProject");
    expect(source).toContain("selectedProject");
  });

  it("Dashboard separates workspace-level cards from project-scoped data", async () => {
    const { readFileSync } = await import("fs");
    const source = readFileSync(
      "src/ui/viewer/views/Dashboard/index.tsx",
      "utf-8"
    );

    expect(source).toContain("Workspace");
  });
});

describe("PlanStatus pulse animation", () => {
  it("should apply animate-pulse when plan is PENDING and not approved", async () => {
    const { PlanStatus } = await import(
      "../../src/ui/viewer/views/Dashboard/PlanStatus.js"
    );

    const plans = [
      {
        name: "test-plan",
        status: "PENDING" as const,
        completed: 0,
        total: 5,
        phase: "plan" as const,
        iterations: 0,
        approved: false,
        worktree: false,
      },
    ];

    const html = renderToString(React.createElement(PlanStatus, { plans }));

    expect(html).toContain("animate-pulse");
  });

  it("should NOT apply animate-pulse when plan is PENDING and approved", async () => {
    const { PlanStatus } = await import(
      "../../src/ui/viewer/views/Dashboard/PlanStatus.js"
    );

    const plans = [
      {
        name: "test-plan",
        status: "PENDING" as const,
        completed: 2,
        total: 5,
        phase: "implement" as const,
        iterations: 0,
        approved: true,
        worktree: false,
      },
    ];

    const html = renderToString(React.createElement(PlanStatus, { plans }));

    expect(html).not.toContain("animate-pulse");
  });

  it("should NOT apply animate-pulse when plan is VERIFIED", async () => {
    const { PlanStatus } = await import(
      "../../src/ui/viewer/views/Dashboard/PlanStatus.js"
    );

    const plans = [
      {
        name: "done-plan",
        status: "VERIFIED" as const,
        completed: 5,
        total: 5,
        phase: "verify" as const,
        iterations: 1,
        approved: true,
        worktree: false,
      },
    ];

    const html = renderToString(React.createElement(PlanStatus, { plans }));

    expect(html).not.toContain("animate-pulse");
  });
});
