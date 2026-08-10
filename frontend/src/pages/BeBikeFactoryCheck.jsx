import { useEffect, useMemo, useState } from "react";
import usePageMeta from "../hooks/usePageMeta";
import "./BeBikeFactoryCheck.css";

export const FACTORY_CHECK_STORAGE_KEY = "be-bike-factory-check:v1";
const DRAFT_SCHEMA_VERSION = 2;

const text = (label, placeholder = "請填寫現場確認結果") => ({ label, type: "text", placeholder });
const number = (label, unit = "") => ({ label, type: "number", unit, placeholder: unit ? `請填數字（${unit}）` : "請填數字" });
const check = (label) => ({ label, type: "check" });

const SAMPLE_ITEMS = ["開機", "電池", "充電", "助力", "騎乘", "煞車", "車輪", "車把", "座管", "傳動", "前籃", "腳架", "異音", "鏽蝕", "輪胎老化"].map(check);

export const FACTORY_CHECK_SECTIONS = [
  { id: "A", title: "現場必拿 10 項", items: [text("合格證號"), check("小黃標照片"), text("電池完整規格"), text("替換電池來源與價格"), text("充電器規格"), text("裝箱尺寸"), number("裝箱重量", "kg"), text("原廠紙箱是否還有"), text("售後最低支援範圍"), number("實際可銷售庫存數量", "台")] },
  { id: "B", title: "法規與身份", items: [check("小黃標"), text("合格證號"), text("車架號"), text("車身銘牌"), text("正式品名"), text("型號"), text("台南市政府合作依據"), text("可提供證明文件")] },
  { id: "C", title: "庫存", items: [
    { ...number("可售總台數", "台"), groupLabel: "核心庫存數量", core: true },
    { ...number("庫存全新品台數", "台"), core: true },
    { ...number("退役二手車台數", "台"), core: true },
    { ...number("外觀瑕疵台數", "台"), groupLabel: "其他狀態" },
    number("缺件台數", "台"), number("無法正常啟動台數", "台"), number("待檢測台數", "台"),
  ] },
  { id: "D", title: "電池", items: [text("品牌"), text("型號"), text("電壓"), text("Ah / Wh"), text("接頭"), text("尺寸"), number("備用電池數量", "顆"), number("單顆成本", "元"), text("相容替代電池"), text("供應商聯絡方式"), text("是否可由我們另售")] },
  { id: "E", title: "充電器", items: [text("型號"), text("輸入"), text("輸出"), text("接頭"), number("備用數量", "個"), number("額外成本", "元")] },
  { id: "F", title: "車輛規格", items: [number("整車重量", "kg"), text("輪徑"), text("馬達位置"), text("額定功率"), number("助力段數", "段"), text("最高輔助速度"), text("是否有油門"), text("煞車種類"), text("燈具"), text("配備")] },
  ...Array.from({ length: 5 }, (_, index) => ({ id: `G${index + 1}`, group: "G", title: `抽樣測試｜第 ${index + 1} 台`, items: SAMPLE_ITEMS })),
  { id: "H", title: "售後", items: [text("是否完全不保固"), text("是否可協助 DOA 判斷"), text("是否提供技術支援"), text("零件料號"), text("零件供應商"), text("馬達替換"), text("控制器替換"), text("儀表替換"), text("合作維修點")] },
  { id: "I", title: "包裝配送", items: [text("是否有原廠紙箱"), text("裝箱長寬高"), number("裝箱重量", "kg"), text("是否拆前輪"), text("是否轉把手"), text("是否拆腳踏"), text("電池是否分開包裝"), text("是否協助裝箱"), number("裝箱人工費", "元"), number("每日包裝能力", "台"), text("是否有棧板")] },
  { id: "J", title: "拍攝素材", items: ["左側", "右側", "正面", "後面", "45度", "前籃", "馬達", "電池", "充電孔", "充電器", "小黃標", "合格證號", "Logo", "庫存", "紙箱", "開機影片", "充電影片", "騎乘影片", "煞車影片", "環車影片"].map(check) },
];

function itemKey(sectionId, index) { return `${sectionId}-${index}`; }

function loadDraft() {
  try {
    const saved = JSON.parse(localStorage.getItem(FACTORY_CHECK_STORAGE_KEY));
    if (!saved || typeof saved !== "object") return { schemaVersion: DRAFT_SCHEMA_VERSION };
    if (saved.schemaVersion === DRAFT_SCHEMA_VERSION) return saved;
    const oldItems = saved.items || {};
    const items = { ...oldItems };
    delete items["C-2"]; delete items["C-3"]; delete items["C-4"]; delete items["C-5"]; delete items["C-6"];
    if (oldItems["C-2"]) items["C-3"] = oldItems["C-2"];
    if (oldItems["C-3"]) items["C-4"] = oldItems["C-3"];
    if (oldItems["C-4"]) items["C-5"] = oldItems["C-4"];
    Object.keys(items).filter((key) => key.startsWith("K-")).forEach((key) => delete items[key]);
    return { ...saved, schemaVersion: DRAFT_SCHEMA_VERSION, items };
  } catch {
    return { schemaVersion: DRAFT_SCHEMA_VERSION };
  }
}

export default function BeBikeFactoryCheck() {
  const [draft, setDraft] = useState(loadDraft);
  const [savedAt, setSavedAt] = useState("");

  usePageMeta({ title: "Be-Bike 工廠現場檢查表", description: "Be-Bike 工廠現場手機檢查表，資料自動保存在目前裝置。" });

  useEffect(() => {
    localStorage.setItem(FACTORY_CHECK_STORAGE_KEY, JSON.stringify(draft));
    setSavedAt(new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" }));
  }, [draft]);

  const total = FACTORY_CHECK_SECTIONS.reduce((sum, section) => sum + section.items.length, 0);
  const completed = useMemo(() => Object.values(draft.items || {}).filter((item) => item?.checked).length, [draft]);
  const percent = Math.round((completed / total) * 100);
  const sellableTotal = Number(draft.items?.["C-0"]?.value || 0);
  const newTotal = Number(draft.items?.["C-1"]?.value || 0);
  const retiredTotal = Number(draft.items?.["C-2"]?.value || 0);
  const knownCoreTotal = newTotal + retiredTotal;
  const showInventoryReminder = draft.items?.["C-0"]?.value !== undefined && sellableTotal !== knownCoreTotal;

  function updateItem(key, patch) {
    setDraft((current) => ({ ...current, items: { ...current.items, [key]: { ...current.items?.[key], ...patch } } }));
  }

  function updateMeta(field, value) { setDraft((current) => ({ ...current, [field]: value })); }

  function resetForm() {
    if (!window.confirm("確定要清除這台裝置上的全部檢查資料嗎？此動作無法復原。")) return;
    localStorage.removeItem(FACTORY_CHECK_STORAGE_KEY);
    setDraft({ schemaVersion: DRAFT_SCHEMA_VERSION });
  }

  return <div className="factory-public-page">
    <header className="factory-public-header">
      <div><p>BE-BIKE FIELD TOOL</p><h1>工廠現場檢查表</h1></div>
      <div className="factory-save-state"><span>自動保存</span><small>{savedAt ? `${savedAt} 已保存` : "準備中"}</small></div>
    </header>
    <main>
      <section className="factory-intro">
        <strong>資料只保存在目前裝置</strong>
        <p>本頁不需登入、不寫入資料庫。請在離開工廠前逐項確認，未取得證據的規格不得作為公開商品聲明。</p>
      </section>
      <section className="factory-meta-card">
        <label>今日日期<input type="date" value={draft.date || ""} onChange={(event) => updateMeta("date", event.target.value)} /></label>
        <label>檢查人<input type="text" value={draft.inspector || ""} onChange={(event) => updateMeta("inspector", event.target.value)} placeholder="請輸入姓名" /></label>
      </section>
      <section className="factory-public-progress" aria-label="檢查進度">
        <div><strong>{percent}%</strong><span>{completed} / {total} 項完成</span></div><progress max="100" value={percent} />
      </section>
      <section className="factory-public-actions" aria-label="表單操作">
        <button type="button" className="factory-print-button" onClick={() => window.print()}>列印 / 存成 PDF</button>
        <button type="button" className="factory-reset-button" onClick={resetForm}>重設表單</button>
      </section>
      <nav className="factory-jump-nav" aria-label="快速前往區塊">
        {FACTORY_CHECK_SECTIONS.filter((section, index, sections) => section.group !== "G" || sections.findIndex((value) => value.group === "G") === index).map((section) => <a key={section.id} href={`#factory-section-${section.group || section.id}`}>{section.group || section.id}</a>)}
      </nav>
      {FACTORY_CHECK_SECTIONS.map((section, sectionIndex) => {
        const anchor = section.group || section.id;
        const sectionDone = section.items.filter((_, index) => draft.items?.[itemKey(section.id, index)]?.checked).length;
        return <section className="factory-check-section" id={sectionIndex === 6 ? `factory-section-${anchor}` : `factory-section-${section.id}`} key={section.id}>
          <header><div><span>{section.group || section.id}</span><h2>{section.title}</h2></div><small>{sectionDone}/{section.items.length}</small></header>
          <div className={section.items.every((item) => item.type === "check") ? "factory-check-grid compact" : "factory-check-grid"}>
            {section.items.map((item, index) => {
              const key = itemKey(section.id, index); const value = draft.items?.[key] || {};
              return <div className={item.groupLabel ? "factory-item-with-heading" : "factory-item-wrapper"} key={key}>
                {item.groupLabel && <h3 className="factory-inventory-group-title">{item.groupLabel}</h3>}
                <article className={`${value.checked ? "completed" : ""}${item.core ? " factory-core-inventory" : ""}`}>
                <label className="factory-item-check"><input type="checkbox" checked={Boolean(value.checked)} onChange={(event) => updateItem(key, { checked: event.target.checked })} /><span>{item.label}</span></label>
                {item.type !== "check" && <div className="factory-value-input"><input type={item.type} inputMode={item.type === "number" ? "decimal" : undefined} value={value.value || ""} onChange={(event) => updateItem(key, { value: event.target.value })} placeholder={item.placeholder} />{item.unit && <span>{item.unit}</span>}</div>}
                </article>
              </div>;
            })}
          </div>
          {section.id === "C" && <div className={`factory-inventory-calculation${showInventoryReminder ? " needs-review" : ""}`} role="status">
            <strong>全新品 + 退役二手 = {knownCoreTotal} 台</strong>
            {showInventoryReminder && <span>請確認可售總台數是否包含其他狀態車輛。</span>}
          </div>}
        </section>;
      })}
      <section className="factory-notes"><label>整體備註<textarea value={draft.notes || ""} onChange={(event) => updateMeta("notes", event.target.value)} placeholder="記錄待追問事項、異常或離場前提醒" /></label></section>
    </main>
    <footer className="factory-public-footer">Be-Bike 工廠現場檢查｜資料僅儲存於此瀏覽器</footer>
  </div>;
}
