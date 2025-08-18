// frontend/src/components/PostList.js
import React, { useEffect, useState } from "react";
import { API } from "../services/api";

export default function PostList({ isAuth }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const me = JSON.parse(localStorage.getItem("user") || "null");

  // fetch posts (feed for auth users, all posts for guests)
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const url = isAuth ? "/feed/" : "/posts/";
      const res = await API.get(url);
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setPosts(data);
    } catch (err) {
      console.error("Error fetching posts:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [isAuth]);

  // like/unlike post
  const toggleLike = async (postId, liked) => {
    try {
      if (!liked) {
        await API.post(`/posts/${postId}/like/`);
      } else {
        await API.delete(`/posts/${postId}/like/`);
      }
      fetchPosts();
    } catch (err) {
      console.error("Like error:", err.response?.data || err.message);
    }
  };

  // add comment
  const addComment = async (postId, text) => {
    if (!text.trim()) return;
    try {
      await API.post(`/posts/${postId}/comments/`, { content: text });
      fetchPosts();
    } catch (err) {
      console.error("Comment error:", err.response?.data || err.message);
    }
  };

  // delete comment
  const deleteComment = async (commentId) => {
    try {
      await API.delete(`/comments/${commentId}/`);
      fetchPosts();
    } catch (err) {
      console.error("Delete comment error:", err.response?.data || err.message);
    }
  };

  // delete own post
  const deletePost = async (postId) => {
    try {
      await API.delete(`/posts/${postId}/`);
      fetchPosts();
    } catch (err) {
      console.error("Delete post error:", err.response?.data || err.message);
    }
  };

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <h2>All Posts</h2>
      {loading && <div className="small">Loading...</div>}
      {posts.length === 0 && !loading && (
        <div className="small">No posts yet.</div>
      )}

      {posts.map((p) => {
        const liked = p.is_liked || false;
        return (
          <div
            key={p.id}
            className="post"
            style={{
              borderBottom: "1px solid #444",
              padding: "8px 0",
              marginBottom: 8,
            }}
          >
            <strong>{p.author?.username || "unknown"}:</strong> {p.content}
            <div className="small">
              Likes: {p.like_count || 0} | Comments: {p.comment_count || 0}
            </div>

            <div style={{ marginTop: 4 }}>
              <button
                className="button"
                onClick={() => toggleLike(p.id, liked)}
              >
                {liked ? `Unlike (${p.like_count || 0})` : `Like (${p.like_count || 0})`}
              </button>
              {me && me.id === p.author?.id && (
                <button
                  className="button"
                  style={{ marginLeft: 8, background: "#ff6b6b" }}
                  onClick={() => deletePost(p.id)}
                >
                  Delete
                </button>
              )}
            </div>

            {/* comments */}
            <div style={{ marginTop: 8 }}>
              {(p.comments || []).map((c) => (
                <div key={c.id} className="small" style={{ marginBottom: 4 }}>
                  <strong>{c.author?.username || "anon"}:</strong> {c.content}
                  {me && me.id === c.author?.id && (
                    <button
                      onClick={() => deleteComment(c.id)}
                      className="button"
                      style={{
                        marginLeft: 8,
                        background: "#ff6b6b",
                        padding: "2px 6px",
                        fontSize: 12,
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}

              {/* add new comment */}
              {isAuth && (
                <CommentBox
                  onSubmit={(text) => addComment(p.id, text)}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// small input for adding comment
function CommentBox({ onSubmit }) {
  const [text, setText] = useState("");
  return (
    <div style={{ display: "flex", marginTop: 6 }}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a comment..."
        style={{ flex: 1, marginRight: 6 }}
      />
      <button
        className="button"
        onClick={() => {
          onSubmit(text);
          setText("");
        }}
      >
        Comment
      </button>
    </div>
  );
}
