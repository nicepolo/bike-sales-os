import { Link } from "react-router-dom";
import { LINE_MESSAGES } from "../config/beBike";
import LineCta from "../components/be-bike/LineCta";
import PublicFooter from "../components/be-bike/PublicFooter";
import PublicHeader from "../components/be-bike/PublicHeader";
import usePageMeta from "../hooks/usePageMeta";
import "./BeBikePublic.css";

const sections = [
  ["商品性質", "Be-Bike 為全新庫存出清專案商品，每台 NT$12,800；實際庫存需由客服確認。"],
  ["商業保固說明", "本批為庫存專案出清商品，原廠不提供一般新品之商業保固服務；依法應有之消費者權利不受影響。"],
  ["交車前基本檢查", "出貨或交車前會進行基本外觀與功能確認；此項檢查不等同未經書面確認的保固承諾。"],
  ["到貨異常處理", "若有明顯運送損傷或到貨即異常，請保留包裝、拍照或錄影，並儘快聯絡客服協助確認。"],
  ["電池消耗品說明", "電池屬消耗性零件，使用狀況與壽命會受使用及保存方式影響；未提供固定壽命或續航承諾。"],
  ["電池付費更換方案", "可提供相容電池供應商資訊，並可另行詢問付費購買或更換方案；實際型號、價格及供應狀況由客服確認。"],
  ["其他維修與零件", "可協助確認零件來源或合作維修資源；是否可修、零件供應與費用需個別確認。"],
  ["配送說明", "可自取或安排貨運，多台可評估專車；配送方式與費用依縣市及數量由客服確認。"],
  ["通訊交易與依法享有權利", "通訊交易的解除權、例外、退換貨及費用負擔，依適用法令、商品性質與實際交易條件認定。完成購買前，請向客服確認完整交易內容。"],
];

export default function BeBikePurchase() {
  usePageMeta({
    title: "Be-Bike 購買確認暨售後說明",
    description: "購買 Be-Bike 前，請閱讀庫存出清商品性質、配送、到貨異常、電池與售後服務說明。",
  });

  return (
    <div className="be-bike-page">
      <PublicHeader />
      <main className="be-bike-purchase-page">
        <header className="be-bike-purchase-hero">
          <p className="be-bike-kicker">PURCHASE INFORMATION</p>
          <h1>Be-Bike 庫存專案<br />購買確認暨售後說明</h1>
          <p>請完整閱讀以下購買與售後說明。確認後，回到 LINE 與客服確認庫存、配送及交易內容。</p>
        </header>
        <div className="be-bike-purchase-list">
          {sections.map(([title, content], index) => (
            <section key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span><div><h2>{title}</h2><p>{content}</p></div>
            </section>
          ))}
        </div>
        <aside className="be-bike-legal-note">
          <strong>請確認</strong>
          <p>本頁為購買前資訊說明，不取代雙方最終確認的完整交易條件，也不限制依法不得排除的消費者權利。</p>
        </aside>
        <div className="be-bike-purchase-actions">
          <LineCta message={LINE_MESSAGES.purchaseConfirmed}>我已閱讀，回 LINE 完成購買</LineCta>
          <Link to="/be-bike">返回 Be-Bike 商品頁</Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
