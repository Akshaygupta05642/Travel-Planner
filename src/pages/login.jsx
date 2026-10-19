import { useState } from "react";

function Login({ onLogin, onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("Logging in...");

    try {
      const response = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      localStorage.setItem("access_token", data.access_token);
      setMessage("Login successful!");
      onLogin?.(data);
    } catch (error) {
      setMessage(error.message || "Could not connect to backend");
    }
  }

  return (
    <main className="auth-page">
      <h1>Welcome Back</h1>
      <p>Log in to continue planning your trips.</p>

      <form onSubmit={handleSubmit}>
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

        <button type="submit">Login</button>
      </form>

      <p>{message}</p>
      <p>
        Don't have an account?{" "}
        <button type="button" onClick={onRegister}>
          Register
        </button>
      </p>
    </main>
  );
}

export default Login;
