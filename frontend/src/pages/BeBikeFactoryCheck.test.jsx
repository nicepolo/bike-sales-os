// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { FACTORY_CHECK_STORAGE_KEY } from "./BeBikeFactoryCheck";

beforeEach(() => localStorage.clear());
afterEach(cleanup);

function renderPage() { return render(<MemoryRouter initialEntries={["/be-bike/factory-check"]}><App /></MemoryRouter>); }

describe("Be-Bike public factory checklist", () => {
  it("renders publicly without requiring login", () => {
    renderPage();
    expect(screen.getByRole("heading", { level: 1, name: "工廠現場檢查表" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "現場必拿 10 項" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "核心庫存數量" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "其他狀態" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "商務條件" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("checkbox").length).toBeGreaterThan(100);
  });

  it("automatically saves checkbox, input and notes to localStorage", async () => {
    renderPage();
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    fireEvent.change(screen.getAllByPlaceholderText("請填寫現場確認結果")[0], { target: { value: "現場證號紀錄" } });
    fireEvent.change(screen.getByPlaceholderText("記錄待追問事項、異常或離場前提醒"), { target: { value: "離場前補拍照片" } });
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem(FACTORY_CHECK_STORAGE_KEY));
      expect(saved.items["A-0"]).toEqual({ checked: true, value: "現場證號紀錄" });
      expect(saved.notes).toBe("離場前補拍照片");
    });
  });

  it("restores saved data after remount", () => {
    localStorage.setItem(FACTORY_CHECK_STORAGE_KEY, JSON.stringify({ inspector: "Polo", items: { "A-0": { checked: true, value: "已取得" } } }));
    renderPage();
    expect(screen.getByDisplayValue("Polo")).toBeInTheDocument();
    expect(screen.getByDisplayValue("已取得")).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")[0]).toBeChecked();
  });

  it("prints through the browser print dialog", () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "列印 / 存成 PDF" }));
    expect(print).toHaveBeenCalledOnce();
    print.mockRestore();
  });

  it("resets saved data only after confirmation", async () => {
    localStorage.setItem(FACTORY_CHECK_STORAGE_KEY, JSON.stringify({ inspector: "Polo" }));
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "重設表單" }));
    expect(confirm).toHaveBeenCalledOnce();
    expect(screen.getByLabelText("檢查人")).toHaveValue("");
    await waitFor(() => expect(JSON.parse(localStorage.getItem(FACTORY_CHECK_STORAGE_KEY))).toEqual({ schemaVersion: 2 }));
    confirm.mockRestore();
  });

  it("calculates the core inventory total without enforcing equality", () => {
    renderPage();
    fireEvent.change(screen.getByLabelText("可售總台數").closest("article").querySelector('input[type="number"]'), { target: { value: "12" } });
    fireEvent.change(screen.getByLabelText("庫存全新品台數").closest("article").querySelector('input[type="number"]'), { target: { value: "8" } });
    fireEvent.change(screen.getByLabelText("退役二手車台數").closest("article").querySelector('input[type="number"]'), { target: { value: "2" } });
    expect(screen.getByText("全新品 + 退役二手 = 10 台")).toBeInTheDocument();
    expect(screen.getByText("請確認可售總台數是否包含其他狀態車輛。")).toBeInTheDocument();
    expect(screen.getByDisplayValue("12")).toBeInTheDocument();
  });
});
