import { useEffect, useMemo, useRef, useState } from "react";
import client from "../api/client";

const ITEM_STATUSES = ["未檢查", "已確認", "不適用", "有問題"];

export default function FactoryChecklist() {
  const [visits, setVisits] = useState([]);
  const [visit, setVisit] = useState(null);
  const [section, setSection] = useState("");
  const [error, setError] = useState("");
  const [savingIds, setSavingIds] = useState([]);
  const saveQueues = useRef({});

  async function loadVisits() { const res = await client.get("/factory-visits"); setVisits(res.data); }
  useEffect(() => { loadVisits().catch(() => setError("工廠訪視載入失敗")); }, []);

  async function openVisit(id) { try { const res = await client.get(`/factory-visits/${id}`); setVisit(res.data); setSection(res.data.items[0]?.section || ""); setError(""); } catch { setError("訪視資料載入失敗，請檢查網路後重試"); } }
  async function createVisit() {
    const title = window.prompt("請輸入訪視名稱", "BE100 工廠實地採集");
    if (!title) return;
    try { const res = await client.post("/factory-visits", { title }); await loadVisits(); await openVisit(res.data.id); } catch { setError("建立訪視失敗，請檢查網路後重試"); }
  }
  async function updateItem(item, patch) {
    const save = async () => {
      setSavingIds((ids) => [...new Set([...ids, item.id])]);
      try {
        const res = await client.put(`/factory-visits/${visit.id}/items/${item.id}`, patch);
        setVisit((current) => ({ ...current, items: current.items.map((value) => value.id === item.id ? res.data : value) }));
        setError("");
      } catch (requestError) {
        setError(requestError.response?.data?.error || "儲存失敗，資料尚未寫入，請檢查網路後重試");
      } finally {
        setSavingIds((ids) => ids.filter((id) => id !== item.id));
      }
    };
    saveQueues.current[item.id] = (saveQueues.current[item.id] || Promise.resolve()).then(save);
    await saveQueues.current[item.id];
  }

  const sections = useMemo(() => visit ? [...new Set(visit.items.map((item) => item.section))] : [], [visit]);
  const items = visit?.items.filter((item) => item.section === section) || [];
  const completed = visit?.items.filter((item) => item.status !== "未檢查").length || 0;
  const percent = visit?.items.length ? Math.round(completed / visit.items.length * 100) : 0;

  if (!visit) return <div><div className="page-heading-row"><h1 className="page-title">工廠採集</h1><button className="btn" onClick={createVisit}>+ 新增訪視</button></div>{error && <div className="error-text">{error}</div>}<div className="customer-cards">{visits.map((v) => <button className="factory-visit-card" key={v.id} onClick={() => openVisit(v.id)}><strong>{v.title}</strong><span>{v.visit_date || "日期未設定"}</span><small>{v.counts?.已確認 || 0} / {v.total_items} 已確認</small></button>)}{visits.length === 0 && <div className="card empty-state">尚未建立工廠訪視</div>}</div></div>;

  return <div>
    <div className="page-heading-row"><button className="btn btn-secondary" onClick={() => setVisit(null)}>← 返回訪視</button><h1 className="page-title">{visit.title}</h1></div>
    <div className="factory-progress"><div><strong>{percent}%</strong><span>{completed} / {visit.items.length} 已處理</span></div><progress max="100" value={percent} /></div>
    <div className="factory-sections">{sections.map((value) => <button aria-pressed={section === value} className={section === value ? "active" : ""} key={value} onClick={() => setSection(value)}>{value}</button>)}</div>
    {error && <div className="error-text factory-error">{error}</div>}
    <div className="factory-items">{items.map((item) => <article className={`factory-item status-${item.status}`} key={item.id}>
      <h3>{item.label}</h3>
      {item.item_key === "legal_questions" && <div className="legal-warning">道路合法性不可只憑口述驗證，必須取得官方文件證據。</div>}
      <div className="factory-statuses">{ITEM_STATUSES.map((status) => <button disabled={savingIds.includes(item.id)} aria-pressed={item.status === status} key={status} onClick={() => updateItem(item, { status })}>{status}</button>)}</div>
      <label>現場答案／數值<textarea defaultValue={item.captured_value || ""} onBlur={(e) => updateItem(item, { captured_value: e.target.value })} /></label>
      <label>證據來源<input type="text" defaultValue={item.evidence_source || ""} onBlur={(e) => updateItem(item, { evidence_source: e.target.value })} placeholder="文件、標籤或回答人" /></label>
      <label>現場備註<textarea defaultValue={item.notes || ""} onBlur={(e) => updateItem(item, { notes: e.target.value })} /></label>
      <label>追問事項<textarea defaultValue={item.follow_up_question || ""} onBlur={(e) => updateItem(item, { follow_up_question: e.target.value })} /></label>
      <label className="verification-check"><input type="checkbox" checked={false} disabled /> 照片／影片證據功能完成後才能標示為已驗證</label>
      {savingIds.includes(item.id) && <small className="saving-text">儲存中…</small>}
    </article>)}</div>
  </div>;
}
