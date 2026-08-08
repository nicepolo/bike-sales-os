import "./BeBikeLanding.css";

const lineUrl = "https://line.me/R/ti/p/@472rcmwf";

const pendingItems = [
  ["價格與庫存", "由真人業務依最新資訊確認"],
  ["規格與配備", "待原廠或實車資料完成核實"],
  ["法規與使用要求", "待正式文件與適用地區確認"],
  ["保固與售後", "待書面條款確認後公布"],
];

export default function BeBikeLanding() {
  return (
    <main className="be-bike-page">
      <nav className="be-bike-nav" aria-label="BE-BIKE 導覽列">
        <a className="be-bike-wordmark" href="#top">BE-BIKE</a>
        <a className="be-bike-nav-cta" href={lineUrl} target="_blank" rel="noreferrer">
          LINE 諮詢
        </a>
      </nav>

      <section className="be-bike-hero" id="top">
        <img src="/be-bike/be-bike-hero.jpg" alt="BE-BIKE 實車停放於公園步道旁" />
        <div className="be-bike-hero-shade" />
        <div className="be-bike-hero-copy">
          <span className="be-bike-eyebrow">實車介紹頁・內容整理中</span>
          <h1>認識 BE-BIKE</h1>
          <p>先從實車外觀開始了解。正式規格、價格、庫存與使用資訊，將依核實資料陸續更新。</p>
          <div className="be-bike-actions">
            <a className="be-bike-primary" href={lineUrl} target="_blank" rel="noreferrer">加入 LINE 預約諮詢</a>
            <a className="be-bike-secondary" href="#gallery">查看實車照片</a>
          </div>
        </div>
      </section>

      <section className="be-bike-section be-bike-intro">
        <div>
          <span className="be-bike-kicker">VISIBLE DETAILS</span>
          <h2>從畫面可確認的實車設計</h2>
        </div>
        <div className="be-bike-visible-grid">
          <article><strong>低跨點車架</strong><span>從側面實車照片可見</span></article>
          <article><strong>前置置物籃</strong><span>實際容量仍待確認</span></article>
          <article><strong>後方電池配置</strong><span>電池規格與操作方式待確認</span></article>
        </div>
      </section>

      <section className="be-bike-gallery be-bike-section" id="gallery">
        <div className="be-bike-gallery-copy">
          <span className="be-bike-kicker">REAL VEHICLE</span>
          <h2>實車外觀</h2>
          <p>以下為實際車輛照片。照片僅用於呈現可見外觀，不代表尚未核實的性能、規格或法規結論。</p>
        </div>
        <figure className="be-bike-gallery-main">
          <img src="/be-bike/be-bike-detail.jpg" alt="BE-BIKE 實車側前方外觀" />
        </figure>
        <figure className="be-bike-gallery-side">
          <img src="/be-bike/be-bike-side.jpg" alt="BE-BIKE 實車完整側面外觀" />
        </figure>
      </section>

      <section className="be-bike-video be-bike-section">
        <span className="be-bike-kicker">VIDEO COMING NEXT</span>
        <h2>操作與騎乘影片準備中</h2>
        <p>影片完成後，這裡將加入實車環繞、操作與騎乘畫面。</p>
        <div className="be-bike-video-placeholder" aria-label="影片預留位置">
          <span>▶</span>
          <small>BE-BIKE 實車影片</small>
        </div>
      </section>

      <section className="be-bike-section be-bike-pending">
        <div className="be-bike-pending-heading">
          <span className="be-bike-kicker">VERIFIED INFORMATION FIRST</span>
          <h2>正式資訊確認中</h2>
          <p>我們不會以推測內容代替產品資料，完成核實後才會公開。</p>
        </div>
        <div className="be-bike-pending-grid">
          {pendingItems.map(([title, detail]) => (
            <article key={title}>
              <span>待確認</span>
              <h3>{title}</h3>
              <p>{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="be-bike-section be-bike-flow">
        <span className="be-bike-kicker">HOW TO START</span>
        <h2>從 LINE 開始了解</h2>
        <ol>
          <li><span>01</span><div><strong>加入 LINE</strong><p>選擇想了解的主題或直接輸入問題。</p></div></li>
          <li><span>02</span><div><strong>取得已確認資訊</strong><p>未核實內容會清楚標示，必要時由真人回覆。</p></div></li>
          <li><span>03</span><div><strong>預約後續諮詢</strong><p>留下方便時間，真人客服會在 LINE 聊天室接手。</p></div></li>
        </ol>
      </section>

      <section className="be-bike-final-cta">
        <p>想先了解哪一項？</p>
        <h2>在 LINE 與我們聊聊 BE-BIKE</h2>
        <a href={lineUrl} target="_blank" rel="noreferrer">開啟 BE-BIKE LINE</a>
      </section>

      <footer className="be-bike-footer">
        <strong>BE-BIKE</strong>
        <span>本頁為內容草稿，產品資訊以正式確認結果為準。</span>
      </footer>
    </main>
  );
}
