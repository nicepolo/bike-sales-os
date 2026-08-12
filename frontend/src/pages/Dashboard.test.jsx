// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Dashboard from "./Dashboard";
import client from "../api/client";

vi.mock("../api/client", () => ({ default: { get: vi.fn() } }));

describe("Dashboard LINE qualification summary", () => {
  beforeEach(() => {
    client.get.mockResolvedValue({ data: {
      sales_qualification: { today_valid_inquiries: 5, today_high_intent: 2, total_high_intent: 8, pending_human_follow_up: 3, closed_deals: 1 },
      B2B: {}, B2C: {}, 經銷: {},
    } });
  });

  it("renders the five lead qualification metrics", async () => {
    render(<Dashboard />);
    for (const label of ["今日有效詢問", "今日高意向", "累計高意向", "待真人跟進", "已成交"]) {
      expect(await screen.findByText(label)).toBeInTheDocument();
    }
  });
});