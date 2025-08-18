import React, { useState } from "react";
import Register from "./components/Register";
import Login from "./components/Login";
import PostList from "./components/PostList";
import Logout from "./components/Logout";
import UserList from "./components/UserList";
import CreatePost from "./components/CreatePost";
import ProfileEdit from "./components/ProfileEdit";
import Notifications from "./components/Notifications";
import AdminPanel from "./components/AdminPanel";

export default function App() {
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem("access"));
  const [view, setView] = useState("home"); // "home" | "profile" | "notifications" | "admin"
  const onLogin = () => setIsAuth(true);
  const onLogout = () => {
    setIsAuth(false);
    setView("home");
  };
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = !!user?.is_staff || !!user?.isAdmin || false;

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="logo">SC</div>
          <div>
            <div className="title">SocialConnect</div>
            <div className="small">A minimal social app — React + Django</div>
          </div>
        </div>

        <nav style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="button small" onClick={() => setView("home")}>Home</button>
          {isAuth && <button className="button small" onClick={() => setView("profile")}>Profile</button>}
          {isAuth && <button className="button small" onClick={() => setView("notifications")}>Notifications</button>}
          {isAuth && isAdmin && <button className="button small" onClick={() => setView("admin")}>Admin</button>}
          {isAuth ? (
            <>
              <div className="small" style={{ marginLeft: 8 }}>Hi, {user?.username}</div>
              <Logout onLogout={() => { onLogout(); }} />
            </>
          ) : null}
        </nav>
      </header>

      <div className="columns">
        <div>
          <div className="card">
            {!isAuth ? (
              <>
                <Register />
                <hr style={{ margin: "12px 0", borderColor: "rgba(255,255,255,0.03)" }} />
                <Login onLogin={onLogin} />
              </>
            ) : view === "profile" ? (
              <div>
                <h2>Your Profile</h2>
                <div className="small">Edit your profile below.</div>
              </div>
            ) : (
              <div>
                <h2>Welcome back</h2>
                <div className="small">Create posts and interact with the community.</div>
              </div>
            )}
          </div>

          {/* show user list only when logged in */}
          {isAuth && <UserList />}
        </div>

        <main style={{ minWidth: 0 }}>
          {view === "home" && (
            <>
              {isAuth && <CreatePost onPostCreated={() => window.location.reload()} />}
              <PostList isAuth={isAuth} />
            </>
          )}

          {view === "profile" && isAuth && (
            <ProfileEdit />
          )}

          {view === "notifications" && isAuth && (
            <Notifications />
          )}

          {view === "admin" && isAuth && isAdmin && (
            <AdminPanel />
          )}

          {view === "admin" && (!isAuth || !isAdmin) && (
            <div className="card" style={{ padding: 12 }}>
              <strong>Admin only</strong>
              <div className="small">You must be an admin to view this section.</div>
            </div>
          )}
        </main>
      </div>

      <div style={{ maxWidth: 920, margin: "18px auto 0" }}>
        <div className="small" style={{ color: "var(--muted)" }}>
          Tip: Register and login to create posts. This is a local dev demo — don't use real passwords.
        </div>
      </div>
    </div>
  );
}
