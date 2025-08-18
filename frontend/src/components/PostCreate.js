// frontend/src/components/PostCreate.js
import React, { useState } from "react";
import { API } from "../services/api";

export default function PostCreate({ onPostCreated }) {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("general");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return alert("Post content cannot be empty");
    if (content.length > 280) return alert("Content exceeds 280 characters");

    try {
      setLoading(true);
      await API.post("/posts/", {
        content,
        image_url: imageUrl || null,
        category,
      });
      setContent("");
      setImageUrl("");
      setCategory("general");
      onPostCreated && onPostCreated();
    } catch (err) {
      console.error("Error creating post:", err.response?.data || err.message);
      alert("Failed to create post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ marginTop: 12, padding: 12 }}>
      <h3>Create Post</h3>
      <textarea
        className="input"
        placeholder="What's on your mind?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        maxLength={280}
        style={{ width: "100%", marginBottom: 8 }}
      />
      <input
        type="text"
        className="input"
        placeholder="Image URL (optional, JPG/PNG)"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        style={{ width: "100%", marginBottom: 8 }}
      />
      <select
        className="input"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        style={{ width: "100%", marginBottom: 8 }}
      >
        <option value="general">General</option>
        <option value="announcement">Announcement</option>
        <option value="question">Question</option>
      </select>
      <button type="submit" className="button" disabled={loading}>
        {loading ? "Posting..." : "Post"}
      </button>
    </form>
  );
}
