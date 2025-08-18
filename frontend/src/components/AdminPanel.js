// frontend/src/components/AdminPanel.js
import React, { useEffect, useState } from "react";
import { API } from "../services/api";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await API.get("/admin/users/");
      setUsers(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      console.error("Fetch admin users error:", err.response?.data || err.message);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await API.get("/admin/posts/");
      setPosts(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      console.error("Fetch admin posts error:", err.response?.data || err.message);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await API.get("/admin/stats/");
      setStats(res.data || null);
    } catch (err) {
      console.error("Fetch stats error:", err.response?.data || err.message);
      setStats(null);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPosts();
    fetchStats();
  }, []);

  const deactivateUser = async (userId) => {
    if (!window.confirm("Deactivate this user?")) return;
    try {
      await API.post(`/admin/users/${userId}/deactivate/`);
      fetchUsers();
    } catch (err) {
      console.error("Deactivate user error:", err.response?.data || err.message);
      alert("Failed to deactivate user.");
    }
  };

  const deletePost = async (postId) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await API.delete(`/admin/posts/${postId}/`);
      fetchPosts();
    } catch (err) {
      console.error("Delete post error:", err.response?.data || err.message);
      alert("Failed to delete post.");
    }
  };

  return (
    <div>
      <div className="card" style={{ padding: 12, marginBottom: 12 }}>
        <h2>Admin Dashboard</h2>
        {stats ? (
          <div className="small">
            Total users: {stats.total_users} • Total posts: {stats.total_posts} • Active today: {stats.active_today}
          </div>
        ) : (
          <div className="small">Loading stats...</div>
        )}
      </div>

      <div className="card" style={{ padding: 12, marginBottom: 12 }}>
        <h3>All Users</h3>
        {loadingUsers && <div className="small">Loading users...</div>}
        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
          {users.map((u) => (
            <li key={u.id} style={{ display: "flex", justifyContent: "space-between", padding: 8, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <div>
                <strong>{u.username}</strong>
                <div className="small" style={{ opacity: 0.8 }}>{u.email}</div>
                <div className="small" style={{ opacity: 0.7 }}>Active: {u.is_active ? "Yes" : "No"}</div>
              </div>
              <div>
                <button className="button small" onClick={() => deactivateUser(u.id)}>Deactivate</button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="card" style={{ padding: 12 }}>
        <h3>All Posts</h3>
        {loadingPosts && <div className="small">Loading posts...</div>}
        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
          {posts.map((p) => (
            <li key={p.id} style={{ padding: 8, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <div><strong>{p.author?.username || "unknown"}</strong> — {p.content}</div>
              <div className="small" style={{ opacity: 0.8 }}>Likes: {p.like_count} • Comments: {p.comment_count}</div>
              <div style={{ marginTop: 6 }}>
                <button className="button small" onClick={() => deletePost(p.id)} style={{ background: "#ff6b6b" }}>Delete Post</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
