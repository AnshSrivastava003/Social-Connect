import React, { useState } from "react";
import { API, setTokens } from "../services/api";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handle = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/login/", { username, password });
      const { access, refresh, user } = res.data;
      setTokens(access, refresh);
      localStorage.setItem("user", JSON.stringify(user));
      alert("Login successful");
      if (onLogin) onLogin();
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("Login failed. Check credentials.");
    }
  };

  return (
    <div className="card" style={{marginTop:12}}>
      <h2>Login</h2>
      <form onSubmit={handle}>
        <div className="form-row">
          <input className="input" value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username or Email" required />
        </div>
        <div className="form-row">
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" required />
        </div>
        <div style={{display:"flex", gap:8}}>
          <button className="button" type="submit">Sign in</button>
        </div>
      </form>
      <div className="footer-note">We use JWT tokens for authentication.</div>
    </div>
  );
}
