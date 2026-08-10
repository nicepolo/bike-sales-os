import { Link } from "react-router-dom";
import { BE_BIKE, LINE_MESSAGES } from "../config/beBike";
import FaqSection from "../components/be-bike/FaqSection";
import LineCta from "../components/be-bike/LineCta";
import PublicFooter from "../components/be-bike/PublicFooter";
import PublicHeader from "../components/be-bike/PublicHeader";
import usePageMeta from "../hooks/usePageMeta";
import "./BeBikePublic.css";

const audiences = ["通勤族", "學生", "外籍工作者", "長輩", "日常短程代步"];

export default function BeBikeLanding() {
  usePageMeta({
    title: "Be-Bike 全新庫存限量出清｜NT$12,800",
    description: "Be-Bike 全新庫存出清，每台 NT$12,800。小黃標、免駕照，可依相關規定合法上路；立即透過 LINE 查詢庫存。",
  });

  return (
    <div className="be-bike-page">
      <PublicHeader />
      <main>
        <section className="be-bike-hero">
          <img src={BE_BIKE.assets.hero} alt="Be-Bike 實車外觀" />
          <div className="be-bike-hero-overlay" />
          <div className="be-bike-hero-content">
            <p className="be-bike-eyebrow">全新庫存・數量有限</p>
            <h1><span>Be-Bike</span><span>全新庫存<br className="be-bike-mobile-break" />限量出清</span></h1>
            <p className="be-bike-price">{BE_BIKE.price} <small>／台</small></p>
            <ul className="be-bike-hero-points">
              <li>小黃標合格車款</li><li>免駕照</li><li>可依相關規定合法上路</li><li>曾與台南市政府合作車款</li>
            </ul>
            <div className="be-bike-actions">
              <LineCta message={LINE_MESSAGES.inventory}>LINE 查庫存</LineCta>
              <Link className="be-bike-button be-bike-button-light" to="/be-bike/purchase">我要購買</Link>
            </div>
          </div>
        </section>

        <section className="be-bike-section be-bike-media" id="product">
          <div className="be-bike-section-heading">
            <p className="be-bike-kicker">REAL PRODUCT</p><h2>真實產品實拍</h2>
            <p>以下皆為 Be-Bike 實車素材。</p>
          </div>
          <div className="be-bike-gallery">
            <img src={BE_BIKE.assets.detail} alt="Be-Bike 實車細節" />
            <img src={BE_BIKE.assets.side} alt="Be-Bike 實車側面" />
          </div>
          {BE_BIKE.assets.video && (
            <video className="be-bike-video" controls playsInline preload="metadata" poster={BE_BIKE.assets.hero}>
              <source src={BE_BIKE.assets.video} />
              您的瀏覽器不支援影片播放。
            </video>
          )}
        </section>

        <section className="be-bike-section be-bike-audience">
          <p className="be-bike-kicker">FOR DAILY LIFE</p><h2>適合日常移動的你</h2>
          <div className="be-bike-chip-grid">{audiences.map((audience) => <span key={audience}>{audience}</span>)}</div>
        </section>

        <section className="be-bike-section be-bike-price-section">
          <div><p className="be-bike-kicker">LIMITED STOCK</p><h2>{BE_BIKE.price}／台</h2><p>全新庫存出清，數量有限。多台、企業採購與團購可另行詢價。</p></div>
          <LineCta message={LINE_MESSAGES.inventory}>詢問庫存與團購</LineCta>
        </section>

        <section className="be-bike-before-buying" aria-labelledby="before-buying-title">
          <p className="be-bike-kicker">BEFORE YOU BUY</p>
          <h2 id="before-buying-title">購買前請先知道</h2>
          <ul>
            <li>本批為全新庫存專案出清</li>
            <li>原廠不提供一般新品商業保固</li>
            <li>電池屬消耗性零件，可提供後續付費更換方案</li>
            <li>配送費依縣市與數量另行確認</li>
          </ul>
          <Link to="/be-bike/purchase">查看完整購買與售後說明</Link>
        </section>

        <section className="be-bike-section be-bike-trust">
          <div><p className="be-bike-kicker">TRUST</p><h2>合法與信任資訊</h2></div>
          <div className="be-bike-info-grid">
            <article><strong>小黃標</strong><p>車輛有小黃標。</p></article>
            <article><strong>合格證號</strong><p>有合格證號；實際號碼尚未提供，不顯示未核實號碼。</p></article>
            <article><strong>免駕照</strong><p>可依相關規定合法上路，使用時仍應遵守適用交通規定。</p></article>
            <article><strong>合作經驗</strong><p>曾與台南市政府合作車款。</p></article>
          </div>
        </section>

        <section className="be-bike-section be-bike-two-column">
          <article>
            <p className="be-bike-kicker">DELIVERY</p><h2>配送說明</h2>
            <ul><li>可自取</li><li>可安排貨運</li><li>多台可評估安排專車</li><li>運費依縣市與數量由客服確認</li></ul>
          </article>
          <article>
            <p className="be-bike-kicker">AFTER SALES</p><h2>售後與電池</h2>
            <ul>
              <li>本批為全新庫存出清</li>
              <li>本批為庫存專案出清商品，<strong>原廠不提供一般新品商業保固</strong>；<strong>依法享有的消費者權利不受影響</strong>。</li>
              <li>出貨或交車前進行基本外觀與功能確認</li><li>到貨明顯損傷或到貨即異常，可聯絡客服協助確認</li>
              <li>電池屬消耗性零件，可提供相容電池供應商資訊</li><li>可另詢付費電池購買、更換及合作維修資源</li>
            </ul>
          </article>
        </section>

        <FaqSection />

        <section className="be-bike-final-cta">
          <p>數量有限，先確認再決定</p><h2>準備了解或購買 Be-Bike？</h2>
          <div className="be-bike-actions be-bike-actions-center">
            <LineCta message={LINE_MESSAGES.inventory}>查庫存</LineCta>
            <Link className="be-bike-button be-bike-button-light" to="/be-bike/purchase">我要購買</Link>
            <LineCta className="be-bike-button be-bike-button-outline" message={LINE_MESSAGES.human}>真人客服</LineCta>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
