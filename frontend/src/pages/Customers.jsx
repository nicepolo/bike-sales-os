import { useEffect, useState } from "react";
import client from "../api/client";
import CustomerForm from "../components/CustomerForm";

const CHANNELS = ["B2B", "B2C", "經銷"];
const STATUSES = ["詢問中", "預約試騎", "已試騎", "已成交", "未成交"];

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [channelFilter, setChannelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    const params = {};
    if (channelFilter) params.channel = channelFilter;
    if (statusFilter) params.status = statusFilter;
    const res = await client.get("/customers", { params });
    setCustomers(res.data);
  }

  useEffect(() => {
    load().catch(() => setError("客戶列表載入失敗"));
  }, [channelFilter, statusFilter]);

  async function handleSubmit(data) {
    if (editing?.id) {
      await client.put(`/customers/${editing.id}`, data);
    } else {
      await client.post("/customers", data);
    }
    setEditing(null);
    await load();
  }

  async function handleDelete(customer) {
    if (!window.confirm(`確定要刪除客戶 ${customer.name} 嗎？`)) return;
    await client.delete(`/customers/${customer.id}`);
    await load();
  }

  return (
    <div>
      <h1 className="page-title">客戶管理</h1>
      <div className="toolbar">
        <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)}>
          <option value="">全部通路</option>
          {CHANNELS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">全部狀態</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button className="btn" onClick={() => setEditing({})}>
          + 新增客戶
        </button>
      </div>
      {error && <div className="error-text">{error}</div>}
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>姓名</th>
              <th>聯絡方式</th>
              <th>通路</th>
              <th>關聯車輛</th>
              <th>狀態</th>
              <th>成交金額</th>
              <th>成交日期</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.contact || "-"}</td>
                <td>{c.channel}</td>
                <td>{c.vehicle_code || "-"}</td>
                <td>
                  <span className="status-badge">{c.status}</span>
                </td>
                <td>{c.deal_amount != null ? `NT$ ${c.deal_amount.toLocaleString()}` : "-"}</td>
                <td>{c.deal_date || "-"}</td>
                <td>
                  <button className="btn btn-secondary" onClick={() => setEditing(c)}>
                    編輯
                  </button>{" "}
                  <button className="btn btn-danger" onClick={() => handleDelete(c)}>
                    刪除
                  </button>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={8}>目前沒有客戶資料</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {editing !== null && (
        <CustomerForm
          initial={editing.id ? editing : null}
          onSubmit={handleSubmit}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}
