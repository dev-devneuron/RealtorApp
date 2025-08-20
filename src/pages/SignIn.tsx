import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
const API_BASE = "https://leasing-copilot-mvp.onrender.com"; 

const SignIn = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include"
      });

      console.log("Response status:", response.status);

      // Try to parse JSON, catch JSON parse errors separately
      let data;
      try {
        data = await response.json();
        console.log("Response data:", data);
      } catch (jsonError) {
        console.error("Failed to parse JSON:", jsonError);
        setError("Server returned invalid response.");
        return;
      }

      if (!response.ok) {
        // Show specific error detail if available, otherwise fallback message
        setError(data.detail || data.message || "Login failed");
        return;
      }
      console.log("Login data:", data);
      // If success, store tokens and realtor_id if provided
      if (data.access_token) localStorage.setItem("access_token", data.access_token);
      if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
      if (data.realtor_id) localStorage.setItem("realtor_id", data.realtor_id);

      alert(`Welcome! Realtor ID: ${data.user.realtor_id || "Unknown"}`);
      navigate("/Dashboard");

      // Redirect or further action here
      // window.location.href = "/dashboard";

    } catch (err) {
  console.error("Fetch error:", err);
  setError(`An error occurred during login: ${err.message || err}`);
}
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "50px" }}>
      <form
        onSubmit={handleLogin}
        style={{
          width: "300px",
          padding: "20px",
          background: "#fff",
          borderRadius: "8px",
          boxShadow: "0px 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ textAlign: "center" }}>Login</h2>
        {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        />
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            background: "#28a745",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default SignIn;
