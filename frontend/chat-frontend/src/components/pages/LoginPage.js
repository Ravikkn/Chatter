import React, { useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../config.js";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/login`, {
        email,
        password,
      });

      // ✅ store token
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // ✅ redirect to chat
      window.location.href = "/";
    } catch (error) {
      console.log(error);
      alert("Login failed");
    }
  };

  return (
    <div style={{ padding: "50px" }}>
      <h2>Login</h2>

      <input
        type="email"
        placeholder="Enter email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <br />
      <br />

      <input
        type="password"
        placeholder="Enter password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br />
      <br />

      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default LoginPage;
