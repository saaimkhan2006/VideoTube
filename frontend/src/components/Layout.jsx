import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Clapperboard,
  Heart,
  Home,
  LayoutDashboard,
  ListVideo,
  LogOut,
  Menu,
  MessageSquareText,
  Search,
  Settings,
  Upload,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function onSearch(e) {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/?q=${encodeURIComponent(q)}` : "/");
    setSidebarOpen(false);
  }

  async function onLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <header className="navbar">
        <button
          className="menu-toggle"
          type="button"
          aria-label="Toggle menu"
          onClick={() => setSidebarOpen((v) => !v)}
        >
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link to="/" className="brand" onClick={() => setSidebarOpen(false)}>
          <span className="brand-mark">
            <Clapperboard size={18} />
          </span>
          <span>VideoTube</span>
        </Link>

        <form className="search-form" onSubmit={onSearch}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search videos"
            aria-label="Search videos"
          />
          <button type="submit" aria-label="Search">
            <Search size={18} />
          </button>
        </form>

        <div className="nav-actions">
          {user ? (
            <>
              <Link to="/upload" className="btn btn-primary btn-sm">
                <Upload size={16} /> Upload
              </Link>
              <Link to={`/channel/${user.username}`} title={user.fullname}>
                <img
                  className="avatar"
                  src={user.avatar}
                  alt={user.username}
                />
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign up
              </Link>
            </>
          )}
        </div>
      </header>

      <div className="layout-body">
        {sidebarOpen && (
          <div
            className="sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <NavLink to="/" end onClick={() => setSidebarOpen(false)}>
            <Home size={18} /> Home
          </NavLink>
          {user && (
            <>
              <NavLink to="/liked" onClick={() => setSidebarOpen(false)}>
                <Heart size={18} /> Liked
              </NavLink>
              <NavLink to="/playlists" onClick={() => setSidebarOpen(false)}>
                <ListVideo size={18} /> Playlists
              </NavLink>
              <NavLink to="/studio" onClick={() => setSidebarOpen(false)}>
                <LayoutDashboard size={18} /> Studio
              </NavLink>
              <NavLink
                to={`/channel/${user.username}?tab=tweets`}
                onClick={() => setSidebarOpen(false)}
              >
                <MessageSquareText size={18} /> Tweets
              </NavLink>
              <NavLink to="/settings" onClick={() => setSidebarOpen(false)}>
                <Settings size={18} /> Settings
              </NavLink>
              <button type="button" className="nav-link" onClick={onLogout}>
                <LogOut size={18} /> Log out
              </button>
            </>
          )}
        </aside>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
