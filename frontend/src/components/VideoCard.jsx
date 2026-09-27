import { Link } from "react-router-dom";
import { formatDuration, formatViews, timeAgo } from "../api/client";

export default function VideoCard({ video }) {
  const id = video._id;
  const title = video.Title || video.title || "Untitled";
  const thumb = video.Thumbnail || video.thumbnail;
  const views = video.Views ?? video.views ?? 0;
  const duration = video.Duration ?? video.duration;
  const createdAt = video.createdAt;
  const owner = video.ownerInfo || video.Owner || {};
  const ownerName =
    owner.username || owner.fullname || (typeof owner === "string" ? "" : "");

  return (
    <Link to={`/watch/${id}`} className="video-card">
      <div className="thumb-wrap">
        {thumb ? (
          <img src={thumb} alt={title} loading="lazy" />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#1a222c" }} />
        )}
        {duration != null && (
          <span className="duration-badge">{formatDuration(duration)}</span>
        )}
      </div>
      <div className="video-meta">
        {owner.avatar && (
          <img className="avatar" src={owner.avatar} alt="" />
        )}
        <div>
          <h3>{title}</h3>
          <p>
            {ownerName ? `${ownerName} · ` : ""}
            {formatViews(views)} views
            {createdAt ? ` · ${timeAgo(createdAt)}` : ""}
          </p>
        </div>
      </div>
    </Link>
  );
}
