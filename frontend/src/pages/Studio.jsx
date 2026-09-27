import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { dashboardApi, formatDuration, videosApi } from "../api/client";

export default function Studio() {
  const location = useLocation();
  const [stats, setStats] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(location.state?.message || "");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [statsRes, videosRes] = await Promise.all([
        dashboardApi.stats(),
        dashboardApi.videos(),
      ]);
      setStats(statsRes.data);
      setVideos(Array.isArray(videosRes.data) ? videosRes.data : []);
    } catch (err) {
      setError(err.message || "Failed to load studio");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function togglePublish(id) {
    try {
      await videosApi.togglePublish(id);
      setMessage("Publish status updated");
      await load();
    } catch (err) {
      setError(err.message || "Could not toggle publish");
    }
  }

  async function removeVideo(id) {
    if (!confirm("Delete this video permanently?")) return;
    try {
      await videosApi.remove(id);
      setMessage("Video deleted");
      await load();
    } catch (err) {
      setError(err.message || "Could not delete video");
    }
  }

  if (loading) return <div className="loading-state">Loading studio…</div>;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 className="page-title">Studio</h1>
          <p className="page-sub">Channel performance and your videos</p>
        </div>
        <Link to="/upload" className="btn btn-primary">
          Upload
        </Link>
      </div>

      {message && <div className="success-banner">{message}</div>}
      {error && <div className="error-banner">{error}</div>}

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <p>Total videos</p>
            <strong>{stats.totalVideos ?? 0}</strong>
          </div>
          <div className="stat-card">
            <p>Total views</p>
            <strong>{stats.totalViews ?? 0}</strong>
          </div>
          <div className="stat-card">
            <p>Subscribers</p>
            <strong>{stats.totalSubscriber ?? 0}</strong>
          </div>
          <div className="stat-card">
            <p>Likes</p>
            <strong>{stats.totalLikes ?? 0}</strong>
          </div>
        </div>
      )}

      {videos.length === 0 ? (
        <div className="empty-state">No uploads yet.</div>
      ) : (
        <div className="table-list">
          {videos.map((v) => (
            <div className="table-row" key={v._id}>
              <img src={v.Thumbnail} alt={v.Title} />
              <div>
                <h3 style={{ margin: "0 0 0.35rem", fontSize: "1rem" }}>
                  <Link to={`/watch/${v._id}`}>{v.Title}</Link>
                </h3>
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  {formatDuration(v.Duration)} · {v.Description?.slice(0, 80)}
                </p>
                <div style={{ marginTop: "0.5rem" }}>
                  <span className={`chip ${v.isPublished ? "chip-on" : "chip-off"}`}>
                    {v.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
              </div>
              <div className="row-actions" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => togglePublish(v._id)}
                >
                  {v.isPublished ? "Unpublish" : "Publish"}
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => removeVideo(v._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
