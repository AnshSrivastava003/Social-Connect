// frontend/src/components/Notifications.js
import React, { useEffect, useState } from "react";
import { API } from "../services/api";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await API.get("/notifications/");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setNotifications(data);
    } catch (err) {
      console.error("Fetch notifications error:", err.response?.data || err.message);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markRead = async (id) => {
    try {
      await API.post(`/notifications/${id}/read/`);
      setNotifications((prev) => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error("Mark read error:", err.response?.data || err.message);
    }
  };

  const markAllRead = async () => {
    try {
      await API.post("/notifications/mark-all-read/");
      setNotifications((prev) => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Mark all read error:", err.response?.data || err.message);
    }
  };

  return (
    <div className="card" style={{ padding: 12 }}>
      <h2>Notifications</h2>
      <div style={{ marginBottom: 8 }}>
        <button className="button small" onClick={fetchNotifications} style={{ marginRight: 8 }}>Refresh</button>
        <button className="button small" onClick={markAllRead}>Mark all read</button>
      </div>

      {loading && <div className="small">Loading...</div>}
      {!loading && notifications.length === 0 && <div className="small">No notifications</div>}

      <ul style={{ listStyle: "none", paddingLeft: 0 }}>
        {notifications.map((n) => (
          <li key={n.id} style={{ padding: 8, borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: n.is_read ? "normal" : "700" }}>
                {n.message}
              </div>
              <div className="small" style={{ opacity: 0.7 }}>
                From: {n.sender?.username || "system"} • {new Date(n.created_at).toLocaleString()}
              </div>
            </div>
            <div>
              {!n.is_read && (
                <button className="button small" onClick={() => markRead(n.id)} style={{ marginRight: 8 }}>
                  Mark read
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
