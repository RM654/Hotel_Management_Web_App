"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_name: userName,
          password,
        }),
      });

      const data = await response.json();
      setMessage(data.message);

      if (response.ok) {
        setUserName("");
        setPassword("");
      }
    } catch {
      setMessage("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-container">
      <form
        className="login-form"
        onSubmit={handleRegister}
      >
        <h1>Create Account</h1>
        <p>Register a new user</p>

        <label htmlFor="userName">Username</label>
        <input
          id="userName"
          type="text"
          value={userName}
          onChange={(event) =>
            setUserName(event.target.value)
          }
          placeholder="Enter username"
          maxLength={50}
          autoComplete="username"
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          placeholder="Create a password"
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>

        {message && <p role="status">{message}</p>}

        <p className="signup-text">
          Already have an account?{" "}
          <Link href="/">Login</Link>
        </p>
      </form>
    </main>
  );
}

