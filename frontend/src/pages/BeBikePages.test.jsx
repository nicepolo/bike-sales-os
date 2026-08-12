// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import App from "../App";
import { createLineMessageUrl, LINE_MESSAGES } from "../config/beBike";

afterEach(cleanup);

function renderRoute(path) {
  return render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
}

describe("Be-Bike public pages", () => {
  it("routes and renders the landing page without authentication", () => {
    const { container } = renderRoute("/be-bike");
    expect(screen.getByRole("heading", { level: 1, name: /Be-Bike.*全新庫存\s*限量出清/s })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "LINE 查庫存" }).length).toBeGreaterThan(0);
    expect(screen.getAllByText("NT$12,800", { exact: false }).length).toBeGreaterThan(0);
    expect(screen.getByText("100 台全新品・限量出清")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "工廠實勘確認規格" })).toBeInTheDocument();
    expect(screen.getByText("36V / 10.2Ah / 367Wh")).toBeInTheDocument();
    expect(screen.getByText("Model HWT-1003-AW-S35")).toBeInTheDocument();
    expect(screen.getByText("以上為 2026/08/12 工廠實車拍攝與標示確認資料。")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "購買前請先知道" })).toBeInTheDocument();
    expect(screen.getByText("原廠不提供一般新品商業保固", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText("依法享有的消費者權利不受影響", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText("若本交易依法屬通訊交易，相關解除權及消費者權益依適用法令辦理。")).toBeInTheDocument();
    expect(document.title).toContain("Be-Bike 全新庫存限量出清");
    expect(document.head.querySelector('meta[property="og:title"]')).toHaveAttribute("content", expect.stringContaining("Be-Bike"));
    const video = container.querySelector("video");
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute("controls");
    expect(video).toHaveAttribute("playsinline");
    expect(video).toHaveAttribute("preload", "metadata");
    expect(video).not.toHaveAttribute("autoplay");
    expect(video.querySelector("source")).toHaveAttribute("src", "/be-bike/be-bike-demo.mp4");
    expect(screen.queryByText(/待上架|VITE_BE_BIKE_VIDEO_URL|後續可直接替換/)).not.toBeInTheDocument();
  });

  it("routes and renders the purchase information page", () => {
    renderRoute("/be-bike/purchase");
    expect(screen.getByRole("heading", { level: 1, name: /Be-Bike 庫存專案.*購買確認暨售後說明/s })).toBeInTheDocument();
    expect(screen.getByText("通訊交易與依法享有權利")).toBeInTheDocument();
  });

  it("uses the shared LINE message URL for inventory CTA", () => {
    renderRoute("/be-bike");
    const inventoryLinks = screen.getAllByRole("link", { name: /LINE 查庫存|加 LINE 查庫存|查庫存/ });
    expect(inventoryLinks.some((link) => link.href === createLineMessageUrl(LINE_MESSAGES.inventory))).toBe(true);
  });

  it("prefills the required purchase confirmation message", () => {
    renderRoute("/be-bike/purchase");
    expect(screen.getByRole("link", { name: "我已閱讀，回 LINE 完成購買" })).toHaveAttribute(
      "href",
      createLineMessageUrl(LINE_MESSAGES.purchaseConfirmed),
    );
  });
});
