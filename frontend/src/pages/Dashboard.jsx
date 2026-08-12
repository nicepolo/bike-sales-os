import { useEffect, useState } from "react";
import client from "../api/client";

const CHANNEL_LABELS = { B2B: "B2B", B2C: "B2C", 經銷: "經銷" };

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    client
      .get("/dashboard/summary")
      .then((res) => setSummary(res.data))
      .catch(() => setError("儀表板資料載入失敗"));
  }, []);

  return (
    <div>
      <h1 className="page-title">儀表板</h1>
      {error && <div className="error-text">{error}</div>}
      {!summary && !error && <p>載入中...</p>}
      {summary && (
        <>
          <div className="card dashboard-card qualification-summary">
            <h3>LINE 銷售資格篩選</h3>
            <div className="dashboard-stat"><span>今日有效詢問</span><strong>{summary.sales_qualification?.today_valid_inquiries ?? 0}</strong></div>
            <div className="dashboard-stat"><span>今日高意向</span><strong>{summary.sales_qualification?.today_high_intent ?? 0}</strong></div>
            <div className="dashboard-stat"><span>累計高意向</span><strong>{summary.sales_qualification?.total_high_intent ?? 0}</strong></div>
            <div className="dashboard-stat"><span>待真人跟進</span><strong>{summary.sales_qualification?.pending_human_follow_up ?? 0}</strong></div>
            <div className="dashboard-stat"><span>已成交</span><strong>{summary.sales_qualification?.closed_deals ?? 0}</strong></div>
          </div>
          <div className="dashboard-grid">
          {Object.keys(CHANNEL_LABELS).map((channel) => {
            const s = summary[channel] || {};
            return (
              <div key={channel} className="card dashboard-card">
                <h3>{CHANNEL_LABELS[channel]}</h3>
                <div className="dashboard-stat">
                  <span>今日詢問數</span>
                  <strong>{s.today_inquiries ?? 0}</strong>
                </div>
                <div className="dashboard-stat">
                  <span>累計詢問數</span>
                  <strong>{s.total_inquiries ?? 0}</strong>
                </div>
                <div className="dashboard-stat">
                  <span>今日成交數</span>
                  <strong>{s.today_deals ?? 0}</strong>
                </div>
                <div className="dashboard-stat">
                  <span>累計成交數</span>
                  <strong>{s.total_deals ?? 0}</strong>
                </div>
                <div className="dashboard-stat">
                  <span>累計成交金額</span>
                  <strong>NT$ {(s.total_deal_amount ?? 0).toLocaleString()}</strong>
                </div>
              </div>
            );
          })}
          </div>
        </>
      )}
    </div>
  );
}
