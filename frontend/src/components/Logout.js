import React from "react";
import { API, clearTokens } from "../services/api";

export default function Logout({ onLogout }) {
  const doLogout = async () => {
    const refresh = localStorage.getItem("refresh");
    try {
      if (refresh) await API.post("/auth/logout/", { refresh });
    } catch (err) {
      console.warn("Logout error", err.response?.data || err.message);
    }
    clearTokens();
    if (onLogout) onLogout();
  };

  return <button className="button" onClick={doLogout}>Logout</button>;
}
