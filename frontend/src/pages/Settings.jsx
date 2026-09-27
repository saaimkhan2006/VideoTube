import { useState } from "react";
import { usersApi } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const [account, setAccount] = useState({
    fullname: user?.fullname || "",
    email: user?.email || "",
  });
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
  });
  const [avatar, setAvatar] = useState(null);
  const [cover, setCover] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function saveAccount(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await usersApi.updateAccount(account);
      await refreshUser();
      setMessage("Account updated");
    } catch (err) {
      setError(err.message || "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await usersApi.changePassword(passwords);
      setPasswords({ oldPassword: "", newPassword: "" });
      setMessage("Password changed");
    } catch (err) {
      setError(err.message || "Password change failed");
    } finally {
      setBusy(false);
    }
  }

  async function uploadAvatar(e) {
    e.preventDefault();
    if (!avatar) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const fd = new FormData();
      fd.append("avatar", avatar);
      await usersApi.updateAvatar(fd);
      await refreshUser();
      setAvatar(null);
      setMessage("Avatar updated");
    } catch (err) {
      setError(err.message || "Avatar update failed");
    } finally {
      setBusy(false);
    }
  }

  async function uploadCover(e) {
    e.preventDefault();
    if (!cover) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const fd = new FormData();
      fd.append("coverImage", cover);
      await usersApi.updateCover(fd);
      await refreshUser();
      setCover(null);
      setMessage("Cover updated");
    } catch (err) {
      setError(err.message || "Cover update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 className="page-title">Settings</h1>
      <p className="page-sub">Manage your profile and security</p>

      {message && <div className="success-banner">{message}</div>}
      {error && <div className="error-banner">{error}</div>}

      <form className="form-stack" onSubmit={saveAccount} style={{ marginBottom: "2rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Account</h2>
        <div className="field">
          <label htmlFor="fullname">Full name</label>
          <input
            id="fullname"
            value={account.fullname}
            onChange={(e) =>
              setAccount((a) => ({ ...a, fullname: e.target.value }))
            }
            required
          />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={account.email}
            onChange={(e) =>
              setAccount((a) => ({ ...a, email: e.target.value }))
            }
            required
          />
        </div>
        <button className="btn btn-primary btn-sm" disabled={busy}>
          Save account
        </button>
      </form>

      <form className="form-stack" onSubmit={changePassword} style={{ marginBottom: "2rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Password</h2>
        <div className="field">
          <label htmlFor="oldPassword">Current password</label>
          <input
            id="oldPassword"
            type="password"
            value={passwords.oldPassword}
            onChange={(e) =>
              setPasswords((p) => ({ ...p, oldPassword: e.target.value }))
            }
            required
          />
        </div>
        <div className="field">
          <label htmlFor="newPassword">New password</label>
          <input
            id="newPassword"
            type="password"
            value={passwords.newPassword}
            onChange={(e) =>
              setPasswords((p) => ({ ...p, newPassword: e.target.value }))
            }
            required
            minLength={6}
          />
        </div>
        <button className="btn btn-ghost btn-sm" disabled={busy}>
          Change password
        </button>
      </form>

      <form className="form-stack" onSubmit={uploadAvatar} style={{ marginBottom: "2rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Avatar</h2>
        {user?.avatar && (
          <img className="avatar avatar-lg" src={user.avatar} alt="" />
        )}
        <div className="field file-field">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setAvatar(e.target.files?.[0] || null)}
          />
        </div>
        <button className="btn btn-soft btn-sm" disabled={busy || !avatar}>
          Update avatar
        </button>
      </form>

      <form className="form-stack" onSubmit={uploadCover}>
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Cover image</h2>
        <div className="field file-field">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCover(e.target.files?.[0] || null)}
          />
        </div>
        <button className="btn btn-soft btn-sm" disabled={busy || !cover}>
          Update cover
        </button>
      </form>
    </div>
  );
}
