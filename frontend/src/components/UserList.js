// frontend/src/components/UserList.js
import React, { useEffect, useState } from "react";
import { API } from "../services/api";

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [followingSet, setFollowingSet] = useState(new Set());
  const [toggling, setToggling] = useState(false);
  const me = JSON.parse(localStorage.getItem("user") || "null");

  const fetchUsers = async () => {
    try {
      const res = await API.get("/users/");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err.response?.data || err.message);
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleFollow = async (userId) => {
    if (!me) {
      alert("Please login to follow users.");
      return;
    }
    if (userId === me.id) {
      alert("You cannot follow yourself.");
      return;
    }

    setToggling(true);
    try {
      if (!followingSet.has(userId)) {
        await API.post(`/users/${userId}/follow/`);
        setFollowingSet((prev) => new Set(prev).add(userId));
      } else {
        await API.delete(`/users/${userId}/follow/`);
        setFollowingSet((prev) => {
          const s = new Set(prev);
          s.delete(userId);
          return s;
        });
      }
      fetchUsers(); // refresh counts
    } catch (err) {
      console.error("Follow toggle error:", err.response?.data || err.message);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <h2>Users</h2>
      <ul className="user-list" style={{ listStyle: "none", paddingLeft: 0 }}>
        {users.length === 0 && <li className="small">No users found</li>}

        {users
          .filter((u) => u.id !== me?.id)
          .map((u) => {
            const isFollowing = followingSet.has(u.id);
            return (
              <li
                key={u.id}
                className="user-item"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 0",
                }}
              >
                <div>
                  <strong>{u.username}</strong>
                  {u.email ? (
                    <div className="small" style={{ opacity: 0.7 }}>
                      {u.email}
                    </div>
                  ) : null}
                  <div className="small" style={{ opacity: 0.7 }}>
                    Followers: {u.followers_count || 0} | Following:{" "}
                    {u.following_count || 0} | Posts: {u.posts_count || 0}
                  </div>
                </div>

                <div>
                  <button
                    className="button"
                    style={{
                      marginLeft: 8,
                      background: isFollowing ? "#ff6b6b" : undefined,
                      borderRadius: 6,
                      padding: "6px 8px",
                    }}
                    onClick={() => toggleFollow(u.id)}
                    disabled={toggling}
                  >
                    {isFollowing ? "Unfollow" : "Follow"}
                  </button>
                </div>
              </li>
            );
          })}
      </ul>
    </div>
  );
}
