import { useEffect, useState } from "react";
import client from "../api/client";

const CHANNELS = ["B2B", "B2C", "經銷"];
const STATUSES = ["新詢問", "已聯絡", "預約試騎", "已下訂", "已付款", "已交車", "流失"];

const EMPTY = {
  name: "",
  contact: "",
  channel: "B2C",
  vehicle_id: "",
  status: "新詢問",
  deal_amount: "",
  is_batch_deal: false,
  batch_note: "",
  referrer: "",
  notes: "",
  sales_owner: "",
  source_platform: "",
  audience_segment: "",
  preferred_language: "",
  interested_price: "",
  next_action: "",
  next_action_due_date: "",
  customer_segment: "",
  source: "",
  language: "",
  interested_quantity: "",
};

const SALES_OWNERS = ["Polo", "Daniel"];
const SOURCES = ["TikTok", "Facebook", "Instagram", "Facebook社團", "LINE", "朋友介紹", "現場", "其他"];
const CUSTOMER_SEGMENTS = ["學生", "外籍移工", "通勤族", "親子家庭", "銀髮族", "其他"];
const LANGUAGES = ["中文", "越南文", "印尼文", "泰文", "其他"];

export default function CustomerForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY,
    ...initial,
    vehicle_id: initial?.vehicle_id ?? "",
    deal_amount: initial?.deal_amount ?? "",
    interested_price: initial?.interested_price ?? "",
    interested_quantity: initial?.interested_quantity ?? "",
  }));
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    client.get("/vehicles").then((res) => setVehicles(res.data));
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { source_platform, audience_segment, preferred_language, ...canonicalForm } = form;
      await onSubmit({
        ...canonicalForm,
        vehicle_id: form.vehicle_id === "" ? null : Number(form.vehicle_id),
        deal_amount: form.deal_amount === "" ? null : Number(form.deal_amount),
        interested_price: form.interested_price === "" ? null : Number(form.interested_price),
        interested_quantity: form.interested_quantity === "" ? null : Number(form.interested_quantity),
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
        <h2 className="page-title">{initial ? "編輯客戶" : "新增客戶"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-field">
              <label>銷售負責人</label>
              <select value={form.sales_owner} onChange={(e) => update("sales_owner", e.target.value)}>
                <option value="">未指派</option>
                {SALES_OWNERS.map((owner) => <option key={owner} value={owner}>{owner}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>來源</label>
              <select value={form.source} onChange={(e) => update("source", e.target.value)}>
                <option value="">未設定</option>
                {SOURCES.map((source) => <option key={source} value={source}>{source}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>姓名/暱稱 *</label>
              <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} required />
            </div>
            <div className="form-field">
              <label>聯絡方式</label>
              <input
                type="text"
                value={form.contact}
                onChange={(e) => update("contact", e.target.value)}
                placeholder="LINE ID 或電話"
              />
            </div>
            <div className="form-field">
              <label>來源通路 *</label>
              <select value={form.channel} onChange={(e) => update("channel", e.target.value)}>
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
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
            <div className="form-field full">
              <label>關聯車輛</label>
              <select value={form.vehicle_id} onChange={(e) => update("vehicle_id", e.target.value)}>
                <option value="">（未選擇）</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicle_code}（{v.status}）
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>成交金額</label>
              <input
                type="number"
                value={form.deal_amount}
                onChange={(e) => update("deal_amount", e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>介紹人</label>
              <input type="text" value={form.referrer} onChange={(e) => update("referrer", e.target.value)} />
            </div>
            <div className="form-field">
              <label>
                <input
                  type="checkbox"
                  checked={form.is_batch_deal}
                  onChange={(e) => update("is_batch_deal", e.target.checked)}
                  style={{ marginRight: 6 }}
                />
                同批交易
              </label>
            </div>
            {form.is_batch_deal && (
              <div className="form-field">
                <label>同批備註</label>
                <input
                  type="text"
                  value={form.batch_note}
                  onChange={(e) => update("batch_note", e.target.value)}
                  placeholder="例如：同批20台工廠訂單"
                />
              </div>
            )}
            <div className="form-field full">
              <label>備註</label>
              <textarea rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
            </div>
          </div>
          <div className="form-grid sales-tracking-fields">
            <div className="form-field"><label>客群</label><select value={form.customer_segment} onChange={(e) => update("customer_segment", e.target.value)}><option value="">未設定</option>{CUSTOMER_SEGMENTS.map((value) => <option key={value}>{value}</option>)}</select></div>
            <div className="form-field"><label>偏好語言</label><select value={form.language} onChange={(e) => update("language", e.target.value)}><option value="">未設定</option>{LANGUAGES.map((value) => <option key={value}>{value}</option>)}</select></div>
            <div className="form-field"><label>預算／有興趣價格</label><input type="number" min="0" value={form.interested_price} onChange={(e) => update("interested_price", e.target.value)} /></div>
            <div className="form-field"><label>預計購買台數</label><input type="number" min="1" step="1" value={form.interested_quantity} onChange={(e) => update("interested_quantity", e.target.value)} /></div>
            <div className="form-field"><label>下次追蹤日期</label><input type="date" value={form.next_action_due_date || ""} onChange={(e) => update("next_action_due_date", e.target.value)} /></div>
            <div className="form-field full"><label>下一步行動</label><input type="text" value={form.next_action} onChange={(e) => update("next_action", e.target.value)} placeholder="例如：明天下午電話確認試騎" /></div>
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
