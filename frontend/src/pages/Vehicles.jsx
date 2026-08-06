import { useEffect, useState } from "react";
import client from "../api/client";
import VehicleForm from "../components/VehicleForm";

const STATUSES = ["待上架", "已上架", "預約試騎", "已成交", "已交車"];

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [editing, setEditing] = useState(null); // null = 表單關閉, {} = 新增, {...} = 編輯
  const [error, setError] = useState("");

  async function load() {
    const res = await client.get("/vehicles", {
      params: statusFilter ? { status: statusFilter } : {},
    });
    setVehicles(res.data);
  }

  useEffect(() => {
    load().catch(() => setError("車輛列表載入失敗"));
  }, [statusFilter]);

  async function handleSubmit(data) {
    if (editing?.id) {
      await client.put(`/vehicles/${editing.id}`, data);
    } else {
      await client.post("/vehicles", data);
    }
    setEditing(null);
    await load();
  }

  async function handleDelete(vehicle) {
    if (!window.confirm(`確定要刪除車輛 ${vehicle.vehicle_code} 嗎？`)) return;
    await client.delete(`/vehicles/${vehicle.id}`);
    await load();
  }

  return (
    <div>
      <h1 className="page-title">車輛管理</h1>
      <div className="toolbar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">全部狀態</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button className="btn" onClick={() => setEditing({})}>
          + 新增車輛
        </button>
      </div>
      {error && <div className="error-text">{error}</div>}
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>車身編號</th>
              <th>來源</th>
              <th>車況</th>
              <th>建議售價</th>
              <th>價格層級</th>
              <th>狀態</th>
              <th>所在地</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id}>
                <td>{v.vehicle_code}</td>
                <td>{v.source_type}</td>
                <td>{v.condition_grade}</td>
                <td>{v.suggested_price != null ? `NT$ ${v.suggested_price.toLocaleString()}` : "-"}</td>
                <td>{v.price_tier ?? "-"}</td>
                <td>
                  <span className="status-badge">{v.status}</span>
                </td>
                <td>{v.location || "-"}</td>
                <td>
                  <button className="btn btn-secondary" onClick={() => setEditing(v)}>
                    編輯
                  </button>{" "}
                  <button className="btn btn-danger" onClick={() => handleDelete(v)}>
                    刪除
                  </button>
                </td>
              </tr>
            ))}
            {vehicles.length === 0 && (
              <tr>
                <td colSpan={8}>目前沒有車輛資料</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {editing !== null && (
        <VehicleForm
          initial={editing.id ? editing : null}
          onSubmit={handleSubmit}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}
