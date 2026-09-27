import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullname: "",
    username: "",
    email: "",
    password: "",
  });
  const [avatar, setAvatar] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!avatar) {
      setError("Avatar image is required");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("fullname", form.fullname.trim());
      fd.append("username", form.username.trim());
      fd.append("email", form.email.trim());
      fd.append("password", form.password);
      fd.append("avatar", avatar);
      if (coverImage) fd.append("coverImage", coverImage);
      await register(fd);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <h1>Create account</h1>
        <p className="lead">Join VideoTube and start uploading</p>
        {error && <div className="error-banner">{error}</div>}
        <form className="form-stack" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="fullname">Full name</label>
            <input
              id="fullname"
              value={form.fullname}
              onChange={update("fullname")}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              value={form.username}
              onChange={update("username")}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={update("email")}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={update("password")}
              required
              minLength={6}
            />
          </div>
          <div className="field file-field">
            <label htmlFor="avatar">Avatar (required)</label>
            <input
              id="avatar"
              type="file"
              accept="image/*"
              onChange={(e) => setAvatar(e.target.files?.[0] || null)}
              required
            />
          </div>
          <div className="field file-field">
            <label htmlFor="cover">Cover image (optional)</label>
            <input
              id="cover"
              type="file"
              accept="image/*"
              onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
            />
          </div>
          <button className="btn btn-primary" disabled={submitting}>
            {submitting ? "Creating…" : "Sign up"}
          </button>
        </form>
        <p style={{ marginTop: "1.25rem", color: "var(--text-muted)" }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
