// frontend/src/components/ProfileEdit.js
import React, { useEffect, useState } from "react";
import { API } from "../services/api";

export default function ProfileEdit() {
  const [form, setForm] = useState({
    bio: "",
    avatar_url: "",
    website: "",
    location: "",
    visibility: "public",
  });
  const [loading, setLoading] = useState(false);

  const loadMe = async () => {
    try {
      const res = await API.get("/users/me/");
      const data = res.data || {};
      setForm({
        bio: data.bio || "",
        avatar_url: data.avatar_url || "",
        website: data.website || "",
        location: data.location || "",
        visibility: data.visibility || "public",
      });
    } catch (err) {
      console.error("Load profile error:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    loadMe();
  }, []);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.put("/users/me/", form);
      alert("Profile updated!");
      loadMe();
    } catch (err) {
      console.error("Update profile error:", err.response?.data || err.message);
      alert("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card" style={{ marginTop: 12, padding: 12 }} onSubmit={onSubmit}>
      <h3>Edit Profile</h3>

      <label>Bio (max 160)</label>
      <textarea
        className="input"
        name="bio"
        maxLength={160}
        value={form.bio}
        onChange={onChange}
        rows={2}
        style={{ width: "100%", marginBottom: 8 }}
      />

      <label>Avatar URL</label>
      <input
        className="input"
        name="avatar_url"
        value={form.avatar_url}
        onChange={onChange}
        placeholder="https://..."
        style={{ width: "100%", marginBottom: 8 }}
      />

      <label>Website</label>
      <input
        className="input"
        name="website"
        value={form.website}
        onChange={onChange}
        placeholder="https://example.com"
        style={{ width: "100%", marginBottom: 8 }}
      />

      <label>Location</label>
      <input
        className="input"
        name="location"
        value={form.location}
        onChange={onChange}
        placeholder="City"
        style={{ width: "100%", marginBottom: 8 }}
      />

      <label>Visibility</label>
      <select
        className="input"
        name="visibility"
        value={form.visibility}
        onChange={onChange}
        style={{ width: "100%", marginBottom: 12 }}
      >
        <option value="public">Public</option>
        <option value="private">Private</option>
        <option value="followers_only">Followers Only</option>
      </select>

      <button className="button" disabled={loading}>{loading ? "Saving..." : "Save"}</button>
    </form>
  );
}
