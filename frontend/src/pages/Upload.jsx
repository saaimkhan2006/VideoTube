import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { videosApi } from "../api/client";

export default function Upload() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [video, setVideo] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!video || !thumbnail) {
      setError("Video and thumbnail files are required");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("description", description.trim());
      fd.append("video", video);
      fd.append("thumbnail", thumbnail);
      const res = await videosApi.upload(fd);
      const id = res.data?._id;
      // New uploads default to unpublished — send user to studio
      navigate(id ? "/studio" : "/studio", {
        state: { message: "Upload complete. Publish it from Studio to show on Home." },
      });
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 className="page-title">Upload video</h1>
      <p className="page-sub">
        Videos start unpublished. Publish them from Studio when ready.
      </p>
      {error && <div className="error-banner">{error}</div>}
      <form className="form-stack" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div className="field file-field">
          <label htmlFor="video">Video file</label>
          <input
            id="video"
            type="file"
            accept="video/*"
            onChange={(e) => setVideo(e.target.files?.[0] || null)}
            required
          />
        </div>
        <div className="field file-field">
          <label htmlFor="thumbnail">Thumbnail</label>
          <input
            id="thumbnail"
            type="file"
            accept="image/*"
            onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
            required
          />
        </div>
        <button className="btn btn-primary" disabled={submitting}>
          {submitting ? "Uploading…" : "Upload"}
        </button>
      </form>
    </div>
  );
}
