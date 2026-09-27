import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { playlistsApi } from "../api/client";
import VideoCard from "../components/VideoCard";

export default function PlaylistDetail() {
  const { playlistId } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    playlistsApi
      .get(playlistId)
      .then((res) => {
        if (!cancelled) setPlaylist(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load playlist");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [playlistId]);

  async function removeVideo(videoId) {
    try {
      await playlistsApi.removeVideo(videoId, playlistId);
      const res = await playlistsApi.get(playlistId);
      setPlaylist(res.data);
    } catch (err) {
      setError(err.message || "Could not remove video");
    }
  }

  if (loading) return <div className="loading-state">Loading playlist…</div>;
  if (error) return <div className="error-state">{error}</div>;
  if (!playlist) return <div className="empty-state">Playlist not found</div>;

  const videos =
    playlist.playlistVideosInfo ||
    playlist.videos ||
    [];

  return (
    <div>
      <p style={{ margin: "0 0 0.5rem" }}>
        <Link to="/playlists" style={{ color: "var(--text-muted)" }}>
          ← Playlists
        </Link>
      </p>
      <h1 className="page-title">{playlist.name}</h1>
      <p className="page-sub">
        {playlist.description || "No description"} ·{" "}
        {playlist.videoCount ?? videos.length} videos
      </p>

      {videos.length === 0 ? (
        <div className="empty-state">This playlist is empty.</div>
      ) : (
        <div className="video-grid">
          {videos.map((v) => {
            const video = v.Title ? v : v.videoInfo || v;
            const id = video._id || v._id;
            return (
              <div key={id}>
                <VideoCard video={{ ...video, _id: id }} />
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  style={{ marginTop: "0.5rem" }}
                  onClick={() => removeVideo(id)}
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
