import { useState } from "react";

const API_BASE_URL = "https://travel-planner-k801.onrender.com";

function Register({ onRegister, onLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("Creating account...");

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Registration failed");
      }

      setMessage("Account created! You can now log in.");
      onRegister?.();
    } catch (error) {
      setMessage(error.message || "Could not connect to backend");
    }
  }

  return (
    <main className="auth-page">
      <h1>Create Account</h1>
      <p>Join Voyagea and start planning your trips.</p>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Create Account</button>
      </form>

      <p>{message}</p>
      <p>
        Already have an account?{" "}
        <button type="button" onClick={onLogin}>
          Login
        </button>
      </p>
    </main>
  );
}

export default Register;
