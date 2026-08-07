import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="brand">電輔車銷售管理系統</div>
        <nav className="app-nav">
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>
            儀表板
          </NavLink>
          <NavLink to="/vehicles" className={({ isActive }) => (isActive ? "active" : "")}>
            車輛管理
          </NavLink>
          <NavLink to="/customers" className={({ isActive }) => (isActive ? "active" : "")}>
            客戶管理
          </NavLink>
          <NavLink to="/factory" className={({ isActive }) => (isActive ? "active" : "")}>
            工廠採集
          </NavLink>
        </nav>
        <button className="logout-btn" onClick={handleLogout}>
          登出
        </button>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
