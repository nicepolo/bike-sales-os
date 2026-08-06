import { useState } from "react";

const SOURCE_TYPES = ["全新", "退役車"];
const CONDITION_GRADES = ["全新", "9成新", "需維修"];
const STATUSES = ["待上架", "已上架", "預約試騎", "已成交", "已交車"];

const EMPTY = {
  vehicle_code: "",
  battery_code: "",
  battery_health: "",
  source_type: "全新",
  condition_grade: "全新",
  suggested_price: "",
  price_tier: "",
  photo_urls: [""],
  status: "待上架",
  location: "",
  listed_date: "",
  sold_date: "",
};

export default function VehicleForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY,
    ...initial,
    photo_urls: initial?.photo_urls?.length ? initial.photo_urls : [""],
    suggested_price: initial?.suggested_price ?? "",
    price_tier: initial?.price_tier ?? "",
    listed_date: initial?.listed_date ?? "",
    sold_date: initial?.sold_date ?? "",
  }));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updatePhotoUrl(index, value) {
    setForm((f) => {
      const urls = [...f.photo_urls];
      urls[index] = value;
      return { ...f, photo_urls: urls };
    });
  }

  function addPhotoUrl() {
    setForm((f) => ({ ...f, photo_urls: [...f.photo_urls, ""] }));
  }

  function removePhotoUrl(index) {
    setForm((f) => ({ ...f, photo_urls: f.photo_urls.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        suggested_price: form.suggested_price === "" ? null : Number(form.suggested_price),
        price_tier: form.price_tier === "" ? null : Number(form.price_tier),
        photo_urls: form.photo_urls.map((u) => u.trim()).filter(Boolean),
        listed_date: form.listed_date || null,
        sold_date: form.sold_date || null,
      });
    } catch (err) {
      setError(err.response?.data?.error || "儲存失敗");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2 className="page-title">{initial ? "編輯車輛" : "新增車輛"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-field">
              <label>車身編號 *</label>
              <input
                type="text"
                value={form.vehicle_code}
                onChange={(e) => update("vehicle_code", e.target.value)}
                placeholder="BK-001"
                required
              />
            </div>
            <div className="form-field">
              <label>電池序號</label>
              <input
                type="text"
                value={form.battery_code}
                onChange={(e) => update("battery_code", e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>電池健康度 / Ah數</label>
              <input
                type="text"
                value={form.battery_health}
                onChange={(e) => update("battery_health", e.target.value)}
                placeholder="例如：80% / 40Ah"
              />
            </div>
            <div className="form-field">
              <label>所在地/倉庫</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>來源類型 *</label>
              <select value={form.source_type} onChange={(e) => update("source_type", e.target.value)}>
                {SOURCE_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>車況等級 *</label>
              <select value={form.condition_grade} onChange={(e) => update("condition_grade", e.target.value)}>
                {CONDITION_GRADES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>建議售價</label>
              <input
                type="number"
                value={form.suggested_price}
                onChange={(e) => update("suggested_price", e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>價格層級</label>
              <input
                type="number"
                value={form.price_tier}
                onChange={(e) => update("price_tier", e.target.value)}
                placeholder="例如：9999"
              />
            </div>
            <div className="form-field">
              <label>狀態</label>
              <select value={form.status} onChange={(e) => update("status", e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>上架日期</label>
              <input
                type="date"
                value={form.listed_date || ""}
                onChange={(e) => update("listed_date", e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>成交日期</label>
              <input
                type="date"
                value={form.sold_date || ""}
                onChange={(e) => update("sold_date", e.target.value)}
              />
            </div>
            <div className="form-field full">
              <label>照片網址</label>
              {form.photo_urls.map((url, i) => (
                <div className="photo-url-row" key={i}>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => updatePhotoUrl(i, e.target.value)}
                    placeholder="https://..."
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => removePhotoUrl(i)}
                    disabled={form.photo_urls.length === 1}
                  >
                    移除
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn-secondary" onClick={addPhotoUrl}>
                + 新增照片網址
              </button>
            </div>
          </div>
          {error && <div className="error-text">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              取消
            </button>
            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? "儲存中..." : "儲存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
