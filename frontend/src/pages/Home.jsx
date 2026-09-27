import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { videosApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import VideoCard from "../components/VideoCard";

export default function Home() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    videosApi
      .list({ page: 1, limit: 24, query: q, sortBy: "createdAt", sortType: "desc" })
      .then((res) => {
        if (cancelled) return;
        const docs = res.data?.docs || res.data || [];
        setVideos(Array.isArray(docs) ? docs : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load videos");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, q]);

  if (!user) {
    return (
      <div className="empty-state" style={{ maxWidth: 520, margin: "4rem auto" }}>
        <h1 className="page-title">Welcome to VideoTube</h1>
        <p className="page-sub">
          Sign in to browse published videos, subscribe to channels, and upload
          your own.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
          <Link to="/login" className="btn btn-primary">
            Log in
          </Link>
          <Link to="/register" className="btn btn-ghost">
            Create account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">{q ? `Results for “${q}”` : "Home"}</h1>
      <p className="page-sub">
        {q ? "Matching published videos" : "Latest published videos"}
      </p>

      {loading && <div className="loading-state">Loading videos…</div>}
      {error && <div className="error-state">{error}</div>}
      {!loading && !error && videos.length === 0 && (
        <div className="empty-state">
          No videos yet. Upload one from Studio and publish it.
        </div>
      )}
      {!loading && videos.length > 0 && (
        <div className="video-grid">
          {videos.map((v) => (
            <VideoCard key={v._id} video={v} />
          ))}
        </div>
      )}
    </div>
  );
}
