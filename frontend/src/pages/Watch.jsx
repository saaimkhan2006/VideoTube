import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  commentsApi,
  formatViews,
  likesApi,
  playlistsApi,
  subscriptionsApi,
  timeAgo,
  usersApi,
  videosApi,
} from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Watch() {
  const { videoId } = useParams();
  const { user } = useAuth();
  const [video, setVideo] = useState(null);
  const [channel, setChannel] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [likeCount, setLikeCount] = useState(null);
  const [liked, setLiked] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [playlistId, setPlaylistId] = useState("");
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      setMessage("");
      try {
        const [videoRes, commentsRes, playlistsRes, relatedRes] =
          await Promise.all([
            videosApi.get(videoId),
            commentsApi.list(videoId),
            user
              ? playlistsApi.byUser(user._id)
              : Promise.resolve({ data: [] }),
            videosApi.list({ page: 1, limit: 8, sortBy: "createdAt", sortType: "desc" }),
          ]);
        if (cancelled) return;

        const v = videoRes.data;
        setVideo(v);

        const commentDocs = commentsRes.data?.docs || [];
        setComments(Array.isArray(commentDocs) ? commentDocs : []);
        setPlaylists(Array.isArray(playlistsRes.data) ? playlistsRes.data : []);

        const docs = relatedRes.data?.docs || [];
        setRelated(
          (Array.isArray(docs) ? docs : []).filter((d) => d._id !== videoId)
        );

        const owner = v.Owner;
        const username =
          typeof owner === "object" ? owner?.username : null;
        if (username) {
          try {
            const ch = await usersApi.channel(username);
            if (!cancelled) setChannel(ch.data);
          } catch {
            if (!cancelled && typeof owner === "object") {
              setChannel(owner);
            }
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load video");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [videoId, user]);

  const ownerId =
    video &&
    (typeof video.Owner === "object" ? video.Owner?._id : video.Owner);
  const isOwner = user && ownerId && String(ownerId) === String(user._id);

  async function toggleLike() {
    try {
      const res = await likesApi.toggleVideo(videoId);
      setLikeCount(res.data?.likeCount ?? likeCount);
      setLiked((v) => !v);
    } catch (err) {
      setMessage(err.message || "Could not like video");
    }
  }

  async function toggleSubscribe() {
    const channelId = channel?._id || ownerId;
    if (!channelId) return;
    try {
      await subscriptionsApi.toggle(channelId);
      if (channel?.username) {
        const res = await usersApi.channel(channel.username);
        setChannel(res.data);
      }
    } catch (err) {
      setMessage(err.message || "Subscribe failed");
    }
  }

  async function submitComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await commentsApi.add(videoId, commentText.trim());
      setCommentText("");
      const commentsRes = await commentsApi.list(videoId);
      setComments(commentsRes.data?.docs || []);
    } catch (err) {
      setMessage(err.message || "Could not post comment");
    }
  }

  async function addToPlaylist() {
    if (!playlistId) return;
    try {
      await playlistsApi.addVideo(videoId, playlistId);
      setMessage("Added to playlist");
    } catch (err) {
      setMessage(err.message || "Could not add to playlist");
    }
  }

  if (loading) return <div className="loading-state">Loading video…</div>;
  if (error) return <div className="error-state">{error}</div>;
  if (!video) return <div className="empty-state">Video not found</div>;

  const channelName =
    channel?.fullname ||
    channel?.username ||
    (typeof video.Owner === "object" ? video.Owner?.fullname : "Channel");
  const channelUsername =
    channel?.username ||
    (typeof video.Owner === "object" ? video.Owner?.username : null);
  const channelAvatar =
    channel?.avatar ||
    (typeof video.Owner === "object" ? video.Owner?.avatar : null);

  return (
    <div className="watch-layout">
      <div>
        <div className="player-wrap">
          <video
            src={video.VideoFile}
            poster={video.Thumbnail}
            controls
            autoPlay
          />
        </div>

        <h1 className="watch-title">{video.Title}</h1>
        <p style={{ margin: 0, color: "var(--text-muted)" }}>
          {formatViews(video.Views)} views · {timeAgo(video.createdAt)}
        </p>

        {message && (
          <div className="success-banner" style={{ marginTop: "1rem" }}>
            {message}
          </div>
        )}

        <div className="watch-actions">
          <button type="button" className="btn btn-soft" onClick={toggleLike}>
            {liked ? "Unlike" : "Like"}
            {likeCount != null ? ` · ${likeCount}` : ""}
          </button>

          {!isOwner && channelIdSafe(channel, ownerId) && (
            <button
              type="button"
              className={`btn ${channel?.isSubscribed ? "btn-ghost" : "btn-primary"}`}
              onClick={toggleSubscribe}
            >
              {channel?.isSubscribed ? "Subscribed" : "Subscribe"}
            </button>
          )}

          {playlists.length > 0 && (
            <>
              <select
                value={playlistId}
                onChange={(e) => setPlaylistId(e.target.value)}
                style={{
                  padding: "0.45rem 0.7rem",
                  borderRadius: 999,
                  border: "1px solid var(--border)",
                  background: "var(--bg-soft)",
                }}
              >
                <option value="">Add to playlist…</option>
                {playlists.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={addToPlaylist}
                disabled={!playlistId}
              >
                Save
              </button>
            </>
          )}
        </div>

        <div className="channel-row">
          {channelAvatar &&
            (channelUsername ? (
              <Link to={`/channel/${channelUsername}`}>
                <img className="avatar avatar-md" src={channelAvatar} alt="" />
              </Link>
            ) : (
              <img className="avatar avatar-md" src={channelAvatar} alt="" />
            ))}
          <div className="info">
            <h4>
              {channelUsername ? (
                <Link to={`/channel/${channelUsername}`}>{channelName}</Link>
              ) : (
                channelName
              )}
            </h4>
            <p>{channel?.subscribersCount ?? 0} subscribers</p>
          </div>
        </div>

        {video.Description && (
          <div className="description-box">{video.Description}</div>
        )}

        <section className="comments">
          <h2 className="page-title" style={{ fontSize: "1.2rem" }}>
            Comments
          </h2>
          <form className="comment-form" onSubmit={submitComment}>
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment…"
            />
            <button className="btn btn-primary btn-sm" type="submit">
              Post
            </button>
          </form>

          {comments.length === 0 && (
            <p style={{ color: "var(--text-muted)" }}>No comments yet.</p>
          )}
          {comments.map((c) => {
            const info = c.commentInfo || {};
            return (
              <div className="comment-item" key={c._id}>
                <img
                  className="avatar"
                  src={
                    info.avatar ||
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect fill='%231a222c' width='40' height='40'/%3E%3C/svg%3E"
                  }
                  alt=""
                />
                <div>
                  <h5>
                    {info.username || "user"} · {timeAgo(c.createdAt)}
                  </h5>
                  <p>{c.content}</p>
                </div>
              </div>
            );
          })}
        </section>
      </div>

      <aside>
        <h3 style={{ marginTop: 0 }}>Up next</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {related.map((v) => (
            <Link
              key={v._id}
              to={`/watch/${v._id}`}
              style={{ display: "flex", gap: "0.65rem" }}
            >
              <img
                src={v.Thumbnail}
                alt={v.Title}
                style={{
                  width: 140,
                  aspectRatio: "16/9",
                  objectFit: "cover",
                  borderRadius: 8,
                  background: "var(--bg-soft)",
                }}
              />
              <div>
                <strong style={{ fontSize: "0.9rem", lineHeight: 1.3 }}>
                  {v.Title}
                </strong>
                <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                  {formatViews(v.Views)} views
                </p>
              </div>
            </Link>
          ))}
          {related.length === 0 && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Browse more on the <Link to="/">home feed</Link>.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

function channelIdSafe(channel, ownerId) {
  return channel?._id || ownerId;
}
