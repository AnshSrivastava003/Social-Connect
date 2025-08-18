import React, { useState } from "react";
import { API } from "../services/api";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const handle = async (e) => {
    e.preventDefault();
    if (password !== password2) {
      alert("Passwords do not match");
      return;
    }
    try {
      await API.post("/auth/register/", { username, email, password, password2 });
      alert("Registered — please login");
      setUsername(""); setEmail(""); setPassword(""); setPassword2("");
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("Registration failed. See console.");
    }
  };

  return (
    <div className="card">
      <h2>Register</h2>
      <form onSubmit={handle}>
        <div className="form-row">
          <input className="input" value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username" required />
        </div>
        <div className="form-row">
          <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" required />
        </div>
        <div className="form-row">
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" required />
        </div>
        <div className="form-row">
          <input className="input" type="password" value={password2} onChange={e=>setPassword2(e.target.value)} placeholder="Confirm password" required />
        </div>
        <div style={{display:"flex", gap:8}}>
          <button className="button" type="submit">Create account</button>
        </div>
      </form>
      <div className="footer-note">Password must be at least 8 characters.</div>
    </div>
  );
}
