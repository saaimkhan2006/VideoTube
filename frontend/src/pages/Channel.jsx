import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  playlistsApi,
  subscriptionsApi,
  timeAgo,
  tweetsApi,
  usersApi,
  videosApi,
} from "../api/client";
import { useAuth } from "../context/AuthContext";
import VideoCard from "../components/VideoCard";

export default function Channel() {
  const { username } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "videos";
  const { user } = useAuth();
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [tweets, setTweets] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [tweetText, setTweetText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isOwn = user?.username === username;

  async function load() {
    setLoading(true);
    setError("");
    try {
      const channelRes = await usersApi.channel(username);
      const ch = channelRes.data;
      setChannel(ch);

      const channelUserId = ch._id;
      const [videosRes, tweetsRes, playlistsRes] = await Promise.all([
        videosApi.list({ userId: channelUserId, page: 1, limit: 24 }),
        tweetsApi.byUser(channelUserId),
        playlistsApi.byUser(channelUserId),
      ]);

      const docs = videosRes.data?.docs || videosRes.data || [];
      setVideos(Array.isArray(docs) ? docs : []);
      setTweets(Array.isArray(tweetsRes.data) ? tweetsRes.data : []);
      setPlaylists(Array.isArray(playlistsRes.data) ? playlistsRes.data : []);
    } catch (err) {
      setError(err.message || "Failed to load channel");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [username]);

  async function toggleSubscribe() {
    try {
      await subscriptionsApi.toggle(channel._id);
      const res = await usersApi.channel(username);
      setChannel(res.data);
    } catch (err) {
      setMessage(err.message || "Subscribe failed");
    }
  }

  async function postTweet(e) {
    e.preventDefault();
    if (!tweetText.trim()) return;
    try {
      await tweetsApi.create(tweetText.trim());
      setTweetText("");
      const res = await tweetsApi.byUser(channel._id);
      setTweets(Array.isArray(res.data) ? res.data : []);
      setMessage("Tweet posted");
    } catch (err) {
      setMessage(err.message || "Could not post tweet");
    }
  }

  async function deleteTweet(id) {
    try {
      await tweetsApi.remove(id);
      setTweets((list) => list.filter((t) => t._id !== id));
    } catch (err) {
      setMessage(err.message || "Could not delete tweet");
    }
  }

  if (loading) return <div className="loading-state">Loading channel…</div>;
  if (error) return <div className="error-state">{error}</div>;
  if (!channel) return <div className="empty-state">Channel not found</div>;

  return (
    <div>
      <div
        className="channel-banner"
        style={
          channel.coverImage
            ? { backgroundImage: `url(${channel.coverImage})` }
            : undefined
        }
      />
      <div className="channel-header">
        <img
          className="avatar avatar-lg"
          src={channel.avatar}
          alt={channel.username}
        />
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 className="page-title" style={{ marginBottom: 0 }}>
            {channel.fullname}
          </h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>
            @{channel.username} · {channel.subscribersCount ?? 0} subscribers ·{" "}
            {channel.channelsSubscribedToCount ?? 0} subscribed
          </p>
        </div>
        {!isOwn && (
          <button
            type="button"
            className={`btn ${channel.isSubscribed ? "btn-ghost" : "btn-primary"}`}
            onClick={toggleSubscribe}
          >
            {channel.isSubscribed ? "Subscribed" : "Subscribe"}
          </button>
        )}
      </div>

      {message && <div className="success-banner">{message}</div>}

      <div className="tabs">
        {["videos", "playlists", "tweets"].map((t) => (
          <button
            key={t}
            type="button"
            className={`tab ${tab === t ? "active" : ""}`}
            onClick={() => setParams(t === "videos" ? {} : { tab: t })}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "videos" && (
        videos.length === 0 ? (
          <div className="empty-state">No published videos.</div>
        ) : (
          <div className="video-grid">
            {videos.map((v) => (
              <VideoCard key={v._id} video={v} />
            ))}
          </div>
        )
      )}

      {tab === "playlists" && (
        playlists.length === 0 ? (
          <div className="empty-state">No playlists.</div>
        ) : (
          <div className="playlist-grid">
            {playlists.map((p) => (
              <Link
                key={p._id}
                to={`/playlists/${p._id}`}
                className="playlist-card"
              >
                <h3>{p.name}</h3>
                <p>{p.description || "No description"}</p>
              </Link>
            ))}
          </div>
        )
      )}

      {tab === "tweets" && (
        <div>
          {isOwn && (
            <form className="form-stack" onSubmit={postTweet} style={{ marginBottom: "1.25rem", maxWidth: 560 }}>
              <div className="field">
                <label htmlFor="tweet">New tweet</label>
                <textarea
                  id="tweet"
                  value={tweetText}
                  onChange={(e) => setTweetText(e.target.value)}
                  placeholder="Share an update…"
                />
              </div>
              <button className="btn btn-primary btn-sm" type="submit">
                Post
              </button>
            </form>
          )}
          {tweets.length === 0 ? (
            <div className="empty-state">No tweets yet.</div>
          ) : (
            tweets.map((t) => {
              const owner = t.owner || {};
              return (
                <div className="tweet-card" key={t._id}>
                  <div className="meta">
                    {owner.avatar && (
                      <img className="avatar" src={owner.avatar} alt="" style={{ width: 28, height: 28 }} />
                    )}
                    <span>@{owner.username || channel.username}</span>
                    <span>· {timeAgo(t.createdAt)}</span>
                    {isOwn && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        style={{ marginLeft: "auto" }}
                        onClick={() => deleteTweet(t._id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p style={{ margin: 0 }}>{t.content}</p>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
