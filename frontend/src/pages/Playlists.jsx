import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { playlistsApi } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Playlists() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await playlistsApi.byUser(user._id);
      setPlaylists(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.message || "Failed to load playlists");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [user._id]);

  async function createPlaylist(e) {
    e.preventDefault();
    try {
      const res = await playlistsApi.create({
        name: name.trim(),
        description: description.trim(),
      });
      setName("");
      setDescription("");
      navigate(`/playlists/${res.data._id}`);
    } catch (err) {
      setError(err.message || "Could not create playlist");
    }
  }

  return (
    <div>
      <h1 className="page-title">Playlists</h1>
      <p className="page-sub">Organize videos into collections</p>

      {error && <div className="error-banner">{error}</div>}

      <form
        className="form-stack"
        onSubmit={createPlaylist}
        style={{
          maxWidth: 480,
          marginBottom: "1.75rem",
          padding: "1.1rem",
          borderRadius: 12,
          border: "1px solid var(--border)",
          background: "var(--bg-elevated)",
        }}
      >
        <div className="field">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <button className="btn btn-primary btn-sm" type="submit">
          Create playlist
        </button>
      </form>

      {loading && <div className="loading-state">Loading…</div>}
      {!loading && playlists.length === 0 && (
        <div className="empty-state">No playlists yet.</div>
      )}
      <div className="playlist-grid">
        {playlists.map((p) => (
          <Link key={p._id} to={`/playlists/${p._id}`} className="playlist-card">
            <h3>{p.name}</h3>
            <p>{p.description || "No description"}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
