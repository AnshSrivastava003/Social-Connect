// frontend/src/components/CreatePost.js
import React, { useState } from "react";
import { API } from "../services/api";

export default function CreatePost({ onPostCreated }) {
  const [form, setForm] = useState({
    content: "",
    category: "general",
    image: null,
  });
  const [loading, setLoading] = useState(false);

  // handle text / category / file inputs
  const onChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setForm((f) => ({ ...f, image: files[0] }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  // handle form submit
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.content.trim()) {
      alert("Post content cannot be empty.");
      return;
    }
    if (form.content.length > 280) {
      alert("Post must be under 280 characters.");
      return;
    }
    if (form.image) {
      const file = form.image;
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        alert("Only JPEG or PNG allowed.");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        alert("Image must be smaller than 2MB.");
        return;
      }
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("content", form.content);
      formData.append("category", form.category);
      if (form.image) {
        formData.append("image", form.image);
      }

      await API.post("/posts/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Post created!");
      setForm({ content: "", category: "general", image: null });
      if (onPostCreated) onPostCreated(); // refresh parent list
    } catch (err) {
      console.error("Post create error:", err.response?.data || err.message);
      alert("Failed to create post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card" style={{ marginTop: 12, padding: 12 }} onSubmit={onSubmit}>
      <h3>Create Post</h3>

      <textarea
        name="content"
        placeholder="What's on your mind?"
        maxLength={280}
        value={form.content}
        onChange={onChange}
        style={{ width: "100%", marginBottom: 8 }}
      />

      <label>Category</label>
      <select
        name="category"
        value={form.category}
        onChange={onChange}
        style={{ width: "100%", marginBottom: 8 }}
      >
        <option value="general">General</option>
        <option value="announcement">Announcement</option>
        <option value="question">Question</option>
      </select>

      <label>Image (optional)</label>
      <input type="file" name="image" accept="image/png,image/jpeg" onChange={onChange} />

      <button className="button" style={{ marginTop: 8 }} disabled={loading}>
        {loading ? "Posting..." : "Post"}
      </button>
    </form>
  );
}
