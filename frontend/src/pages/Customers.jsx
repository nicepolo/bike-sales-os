import { useEffect, useMemo, useState } from "react";
import client from "../api/client";
import CustomerForm from "../components/CustomerForm";

const CHANNELS = ["B2B", "B2C", "經銷"];
const STATUSES = ["詢問中", "預約試騎", "已試騎", "已成交", "未成交"];
const SALES_OWNERS = ["Polo", "Daniel"];
const SOURCE_PLATFORMS = ["TikTok", "Facebook廣告", "Facebook社團", "Instagram", "移工社群", "LINE", "朋友介紹", "現場", "其他"];

function isOverdue(customer) {
  if (!customer.next_action_due_date) return false;
  const taipeiNow = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const today = taipeiNow.toISOString().slice(0, 10);
  return customer.next_action_due_date < today;
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [filters, setFilters] = useState({ channel: "", status: "", sales_owner: "", source_platform: "", overdue: false });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    const params = Object.fromEntries(Object.entries(filters).filter(([key, value]) => key !== "status" && value));
    const res = await client.get("/customers", { params });
    setCustomers(res.data);
  }

  useEffect(() => {
    load().catch(() => setError("客戶資料載入失敗"));
  }, [filters.channel, filters.sales_owner, filters.source_platform, filters.overdue]);

  const counts = useMemo(() => Object.fromEntries(STATUSES.map((status) => [status, customers.filter((c) => c.status === status).length])), [customers]);
  const visibleCustomers = useMemo(() => filters.status ? customers.filter((customer) => customer.status === filters.status) : customers, [customers, filters.status]);

  function setFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(data) {
    if (editing?.id) await client.put(`/customers/${editing.id}`, data);
    else await client.post("/customers", data);
    setEditing(null);
    await load();
  }

  async function handleDelete(customer) {
    if (!window.confirm(`確定要刪除客戶「${customer.name}」嗎？`)) return;
    await client.delete(`/customers/${customer.id}`);
    await load();
  }

  return (
    <div>
      <div className="page-heading-row">
        <h1 className="page-title">客戶銷售漏斗</h1>
        <button className="btn" onClick={() => setEditing({})}>+ 新增客戶</button>
      </div>

      <div className="funnel-grid">
        {STATUSES.map((status) => (
          <button key={status} aria-pressed={filters.status === status} className={`funnel-card ${filters.status === status ? "active" : ""}`} onClick={() => setFilter("status", filters.status === status ? "" : status)}>
            <span>{status}</span><strong>{counts[status] || 0}</strong>
          </button>
        ))}
      </div>

      <div className="toolbar customer-filters">
        <select value={filters.channel} onChange={(e) => setFilter("channel", e.target.value)}><option value="">全部客群類型</option>{CHANNELS.map((v) => <option key={v}>{v}</option>)}</select>
        <select value={filters.sales_owner} onChange={(e) => setFilter("sales_owner", e.target.value)}><option value="">全部負責人</option>{SALES_OWNERS.map((v) => <option key={v}>{v}</option>)}</select>
        <select value={filters.source_platform} onChange={(e) => setFilter("source_platform", e.target.value)}><option value="">全部來源</option>{SOURCE_PLATFORMS.map((v) => <option key={v}>{v}</option>)}</select>
        <label className="overdue-filter"><input type="checkbox" checked={filters.overdue} onChange={(e) => setFilter("overdue", e.target.checked)} /> 只看逾期追蹤</label>
      </div>

      {error && <div className="error-text">{error}</div>}
      <div className="customer-cards">
        {visibleCustomers.map((customer) => (
          <article className={`customer-card ${isOverdue(customer) ? "overdue" : ""}`} key={customer.id}>
            <div className="customer-card-header"><strong>{customer.name}</strong><span className="status-badge">{customer.status}</span></div>
            <div className="customer-meta"><span>{customer.sales_owner || "未指派"}</span><span>{customer.source_platform || "來源未設定"}</span><span>{customer.channel}</span><span>{customer.contact || "無聯絡資料"}</span></div>
            <div className="customer-sales-detail">
              <span>車輛：<strong>{customer.vehicle_code || "未指定"}</strong></span>
              <span>成交金額：<strong>{customer.deal_amount != null ? `NT$ ${customer.deal_amount.toLocaleString()}` : "未設定"}</strong></span>
              <span>成交日期：<strong>{customer.deal_date || "未設定"}</strong></span>
            </div>
            <div className="next-action"><span>下一步</span><strong>{customer.next_action || "尚未設定"}</strong><small className={isOverdue(customer) ? "overdue-text" : ""}>{customer.next_action_due_date || "無日期"}{isOverdue(customer) ? "（已逾期）" : ""}</small></div>
            <div className="customer-card-actions"><button className="btn btn-secondary" onClick={() => setEditing(customer)}>編輯</button><button className="btn btn-danger" onClick={() => handleDelete(customer)}>刪除</button></div>
          </article>
        ))}
        {visibleCustomers.length === 0 && <div className="card empty-state">目前沒有符合條件的客戶</div>}
      </div>

      {editing !== null && <CustomerForm initial={editing.id ? editing : null} onSubmit={handleSubmit} onCancel={() => setEditing(null)} />}
    </div>
  );
}
