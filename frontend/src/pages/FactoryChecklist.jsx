import { useEffect, useMemo, useRef, useState } from "react";
import client from "../api/client";

const ITEM_STATUSES = ["未檢查", "已確認", "不適用", "有問題"];

export default function FactoryChecklist() {
  const [visits, setVisits] = useState([]);
  const [visit, setVisit] = useState(null);
  const [section, setSection] = useState("");
  const [error, setError] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const [visitDraft, setVisitDraft] = useState({ title: "", factory_name: "", visit_date: "", notes: "" });
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [savingIds, setSavingIds] = useState([]);
  const saveQueues = useRef({});

  async function loadVisits() { const res = await client.get("/factory-visits"); setVisits(res.data); }
  useEffect(() => { loadVisits().catch(() => setError("工廠訪視載入失敗")); }, []);

  async function openVisit(id) { try { const res = await client.get(`/factory-visits/${id}`); setVisit(res.data); setVisitDraft({ title: res.data.title, factory_name: res.data.factory_name || "", visit_date: res.data.visit_date || "", notes: res.data.notes || "" }); setSection(res.data.items[0]?.section || ""); setShowSummary(false); setCopyMessage(""); setError(""); } catch { setError("訪視資料載入失敗，請檢查網路後重試"); } }
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
  function changeVisitDraft(event) { setVisitDraft((current) => ({ ...current, [event.target.name]: event.target.value })); }
  async function saveVisitDetails(event) {
    event.preventDefault();
    setDetailsSaving(true);
    try {
      const res = await client.put(`/factory-visits/${visit.id}`, visitDraft);
      setVisit(res.data);
      setVisitDraft({ title: res.data.title, factory_name: res.data.factory_name || "", visit_date: res.data.visit_date || "", notes: res.data.notes || "" });
      await loadVisits();
      setError("");
    } catch (requestError) { setError(requestError.response?.data?.error || "訪視資料儲存失敗，請稍後重試"); }
    finally { setDetailsSaving(false); }
  }

  const sections = useMemo(() => visit ? [...new Set(visit.items.map((item) => item.section))] : [], [visit]);
  const items = visit?.items.filter((item) => item.section === section) || [];
  const completed = visit?.items.filter((item) => item.status !== "未檢查").length || 0;
  const percent = visit?.items.length ? Math.round(completed / visit.items.length * 100) : 0;
  const unresolvedItems = useMemo(() => visit?.items.filter((item) => item.status === "有問題" || item.status === "未檢查" || item.follow_up_question) || [], [visit]);
  const summaryText = useMemo(() => {
    if (!visit) return "";
    const sectionLines = [...new Set(visit.items.map((item) => item.section))].map((name) => {
      const sectionItems = visit.items.filter((item) => item.section === name);
      const done = sectionItems.filter((item) => item.status !== "未檢查").length;
      const confirmed = sectionItems.filter((item) => item.status === "已確認").length;
      const issues = sectionItems.filter((item) => item.status === "有問題").length;
      return `- ${name}：${done}/${sectionItems.length} 已處理；${confirmed} 已確認；${issues} 有問題`;
    });
    const questionLines = unresolvedItems.map((item) => `- [${item.section}] ${item.label}｜狀態：${item.status}${item.follow_up_question ? `｜追問：${item.follow_up_question}` : ""}${item.notes ? `｜備註：${item.notes}` : ""}`);
    const confirmed = visit.items.filter((item) => item.status === "已確認").length;
    const issues = visit.items.filter((item) => item.status === "有問題").length;
    return [`工廠訪視摘要：${visit.title}`, `日期：${visit.visit_date || "未設定"}`, `工廠：${visit.factory_name || "未設定"}`, `已處理進度：${percent}%（${completed}/${visit.items.length}）`, `其中已確認：${confirmed}；有問題：${issues}`, "", "各區進度", ...sectionLines, "", `未解項目（${unresolvedItems.length}）`, ...(questionLines.length ? questionLines : ["- 無"]), "", "注意：待確認資料不得作為公開產品聲明；工廠全量盤點與我方抽樣紀錄必須分開。"].join("\n");
  }, [visit, unresolvedItems, percent, completed]);

  async function copySummary() {
    try { await navigator.clipboard.writeText(summaryText); setCopyMessage("摘要已複製"); setError(""); }
    catch { setError("無法自動複製，請改用下載摘要"); }
  }
  function downloadSummary() {
    const blob = new Blob([summaryText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `factory-visit-${visit.id}-summary.txt`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  if (!visit) return <div><div className="page-heading-row"><h1 className="page-title">工廠採集</h1><button className="btn" onClick={createVisit}>+ 新增訪視</button></div>{error && <div className="error-text">{error}</div>}<div className="customer-cards">{visits.map((v) => <button className="factory-visit-card" key={v.id} onClick={() => openVisit(v.id)}><strong>{v.title}</strong><span>{v.visit_date || "日期未設定"}</span><small>{v.counts?.已確認 || 0} / {v.total_items} 已確認</small></button>)}{visits.length === 0 && <div className="card empty-state">尚未建立工廠訪視</div>}</div></div>;

  return <div>
    <div className="page-heading-row factory-heading"><button className="btn btn-secondary" onClick={() => { setVisit(null); setShowSummary(false); }}>← 返回訪視</button><h1 className="page-title">{visit.title}</h1><button className="btn" onClick={() => setShowSummary((value) => !value)}>{showSummary ? "返回採集" : `訪視摘要 (${unresolvedItems.length})`}</button></div>
    <form className="factory-visit-details" onSubmit={saveVisitDetails}>
      <label>訪視名稱<input name="title" maxLength="120" required value={visitDraft.title} onChange={changeVisitDraft} /></label>
      <label>工廠名稱<input name="factory_name" maxLength="120" value={visitDraft.factory_name} onChange={changeVisitDraft} /></label>
      <label>訪視日期<input name="visit_date" type="date" value={visitDraft.visit_date} onChange={changeVisitDraft} /></label>
      <label className="factory-details-notes">整體備註<textarea name="notes" value={visitDraft.notes} onChange={changeVisitDraft} /></label>
      <button className="btn" disabled={detailsSaving} type="submit">{detailsSaving ? "儲存中…" : "儲存訪視資料"}</button>
    </form>
    <div className="factory-progress"><div><strong>{percent}%</strong><span>{completed} / {visit.items.length} 已處理</span></div><progress max="100" value={percent} /></div>
    {showSummary && <section className="factory-summary">
      <div className="factory-summary-actions"><button className="btn" onClick={copySummary}>複製摘要</button><button className="btn btn-secondary" onClick={downloadSummary}>下載文字檔</button>{copyMessage && <span className="copy-message" role="status">{copyMessage}</span>}</div>
      <h2>未解問題與離場檢查</h2>
      <p>共 {unresolvedItems.length} 項需要檢查、處理或追問。</p>
      {unresolvedItems.length === 0 ? <div className="empty-state">目前沒有未解項目</div> : unresolvedItems.map((item) => <article className="summary-question" key={item.id}><strong>{item.section}｜{item.label}</strong><span>{item.status}</span>{item.follow_up_question && <p>追問：{item.follow_up_question}</p>}{item.notes && <p>備註：{item.notes}</p>}</article>)}
      <div className="legal-warning">摘要中的「待確認」資訊不可直接用於廣告、官網或法律聲明。</div>
    </section>}
    {!showSummary && <>
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
    </article>)}</div></>}
  </div>;
}
