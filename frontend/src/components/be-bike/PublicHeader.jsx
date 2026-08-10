import { Link } from "react-router-dom";
import { LINE_MESSAGES } from "../../config/beBike";
import LineCta from "./LineCta";

export default function PublicHeader() {
  return (
    <header className="be-bike-header">
      <Link className="be-bike-logo" to="/be-bike">Be-Bike</Link>
      <LineCta className="be-bike-header-cta" message={LINE_MESSAGES.inventory}>LINE 查庫存</LineCta>
    </header>
  );
}
