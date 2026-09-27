import { useEffect, useState } from "react";
import { likesApi } from "../api/client";
import VideoCard from "../components/VideoCard";

export default function Liked() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    likesApi
      .videos()
      .then((res) => {
        if (cancelled) return;
        const rows = Array.isArray(res.data) ? res.data : [];
        setVideos(
          rows
            .map((row) => {
              const info = row.videoInfo || row;
              return info?._id ? info : null;
            })
            .filter(Boolean)
        );
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load liked videos");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1 className="page-title">Liked videos</h1>
      <p className="page-sub">Videos you have liked</p>
      {loading && <div className="loading-state">Loading…</div>}
      {error && <div className="error-state">{error}</div>}
      {!loading && !error && videos.length === 0 && (
        <div className="empty-state">No liked videos yet.</div>
      )}
      <div className="video-grid">
        {videos.map((v) => (
          <VideoCard key={v._id} video={v} />
        ))}
      </div>
    </div>
  );
}
