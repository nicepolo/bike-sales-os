import { useEffect, useMemo, useState } from "react";
import client from "../api/client";
import CustomerForm from "../components/CustomerForm";

const CHANNELS = ["B2B", "B2C", "經銷"];
const STATUSES = ["詢問中", "預約試騎", "已試騎", "已成交", "未成交"];
const ACTIVE_STATUSES = ["詢問中", "預約試騎", "已試騎"];
const SALES_OWNERS = ["Polo", "Daniel"];
const OWNER_VIEWS = [{ key: "Polo", label: "Polo" }, { key: "Daniel", label: "Daniel" }, { key: "unassigned", label: "未指派" }];
const SOURCE_PLATFORMS = ["TikTok", "Facebook廣告", "Facebook社團", "Instagram", "移工社群", "LINE", "朋友介紹", "現場", "其他"];

function isOverdue(customer) {
  if (!customer.next_action_due_date || !ACTIVE_STATUSES.includes(customer.status)) return false;
  const taipeiNow = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const today = taipeiNow.toISOString().slice(0, 10);
  return customer.next_action_due_date < today;
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [filters, setFilters] = useState({ channel: "", status: "", sales_owner: "", source_platform: "", follow_up: "" });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [workload, setWorkload] = useState({});

  async function load() {
    const params = Object.fromEntries(Object.entries(filters).filter(([key, value]) => key !== "status" && value));
    const res = await client.get("/customers", { params });
    setCustomers(res.data);
  }
  async function loadWorkload() {
    const params = Object.fromEntries(Object.entries({ channel: filters.channel, source_platform: filters.source_platform }).filter(([, value]) => value));
    const res = await client.get("/customers/workload", { params });
    setWorkload(res.data);
  }

  useEffect(() => {
    load().catch(() => setError("客戶資料載入失敗"));
  }, [filters.channel, filters.sales_owner, filters.source_platform, filters.follow_up]);
  useEffect(() => { loadWorkload().catch(() => setError("負責人工作量載入失敗")); }, [filters.channel, filters.source_platform]);

  const counts = useMemo(() => Object.fromEntries(STATUSES.map((status) => [status, customers.filter((c) => c.status === status).length])), [customers]);
  const visibleCustomers = useMemo(() => filters.status ? customers.filter((customer) => customer.status === filters.status) : customers, [customers, filters.status]);
  const selectedWorkload = useMemo(() => {
    const label = OWNER_VIEWS.find((owner) => owner.key === filters.sales_owner)?.label;
    if (label) return workload[label] || {};
    return Object.values(workload).reduce((total, metrics) => ({
      active: (total.active || 0) + (metrics.active || 0),
      due_today: (total.due_today || 0) + (metrics.due_today || 0),
      overdue: (total.overdue || 0) + (metrics.overdue || 0),
      no_next_action: (total.no_next_action || 0) + (metrics.no_next_action || 0),
    }), {});
  }, [workload, filters.sales_owner]);

  function setFilter(field, value) {
    setFilters((current) => {
      const next = { ...current, [field]: value };
      if (field === "follow_up" && value) next.status = "";
      if (field === "status" && value && !ACTIVE_STATUSES.includes(value)) next.follow_up = "";
      return next;
    });
  }

  async function handleSubmit(data) {
    if (editing?.id) await client.put(`/customers/${editing.id}`, data);
    else await client.post("/customers", data);
    setEditing(null);
    await Promise.all([load(), loadWorkload()]);
  }

  async function handleDelete(customer) {
    if (!window.confirm(`確定要刪除客戶「${customer.name}」嗎？`)) return;
    await client.delete(`/customers/${customer.id}`);
    await Promise.all([load(), loadWorkload()]);
  }

  return (
    <div>
      <div className="page-heading-row">
        <h1 className="page-title">客戶銷售漏斗</h1>
        <button className="btn" onClick={() => setEditing({})}>+ 新增客戶</button>
      </div>

      <div className="owner-workload-grid">
        {OWNER_VIEWS.map(({ key, label }) => {
          const metrics = workload[label] || {};
          return <button key={key} aria-pressed={filters.sales_owner === key} className={`owner-workload-card ${filters.sales_owner === key ? "active" : ""}`} onClick={() => setFilter("sales_owner", filters.sales_owner === key ? "" : key)}>
            <strong>{label}</strong><span>{metrics.active || 0} 位進行中</span>
            <small>今日 {metrics.due_today || 0}・逾期 {metrics.overdue || 0}・未排下一步 {metrics.no_next_action || 0}</small>
          </button>;
        })}
      </div>

      <div className="follow-up-queues" aria-label="待跟進工作佇列">
        {[{ key: "due_today", label: "今日到期", count: selectedWorkload.due_today }, { key: "overdue", label: "已逾期", count: selectedWorkload.overdue }, { key: "no_next_action", label: "未排下一步", count: selectedWorkload.no_next_action }].map((queue) => <button key={queue.key} aria-pressed={filters.follow_up === queue.key} className={filters.follow_up === queue.key ? "active" : ""} onClick={() => setFilter("follow_up", filters.follow_up === queue.key ? "" : queue.key)}><span>{queue.label}</span><strong>{queue.count || 0}</strong></button>)}
        {filters.follow_up && <button className="clear-queue" onClick={() => setFilter("follow_up", "")}>顯示全部</button>}
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
        <select value={filters.sales_owner} onChange={(e) => setFilter("sales_owner", e.target.value)}><option value="">全部負責人</option>{SALES_OWNERS.map((v) => <option key={v}>{v}</option>)}<option value="unassigned">未指派</option></select>
        <select value={filters.source_platform} onChange={(e) => setFilter("source_platform", e.target.value)}><option value="">全部來源</option>{SOURCE_PLATFORMS.map((v) => <option key={v}>{v}</option>)}</select>
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
