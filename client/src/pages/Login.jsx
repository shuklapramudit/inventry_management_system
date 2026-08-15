import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();

  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState("");

  // =====================================================
  // HANDLE LOGIN
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError(
        "Please enter your email and password."
      );

      return;
    }

    try {
      setLoading(true);

      // -------------------------------------------------
      // LOGIN THROUGH AUTH CONTEXT
      // -------------------------------------------------

      await login(
        cleanEmail,
        password
      );

      // -------------------------------------------------
      // LOGIN SUCCESS
      // -------------------------------------------------

      navigate("/dashboard", {
        replace: true,
      });

    } catch (error) {
      console.error(
        "Login failed:",
        error
      );

      setError(
        error?.message ||
          "Unable to login. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">

        {/* =================================================
            BRAND
            ================================================= */}

        <div className="login-brand">

          <div className="login-logo">
            CP
          </div>

          <h1>
            Chashma Plus
          </h1>

          <p>
            Inventory Management System
          </p>

        </div>

        {/* =================================================
            HEADING
            ================================================= */}

        <div className="login-heading">

          <h2>
            Welcome Back
          </h2>

          <p>
            Sign in to continue to your account
          </p>

        </div>

        {/* =================================================
            ERROR
            ================================================= */}

        {error && (
          <div
            className="login-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* =================================================
            LOGIN FORM
            ================================================= */}

        <form
          className="login-form"
          onSubmit={handleSubmit}
          noValidate
        >

          {/* EMAIL */}

          <div className="login-field">

            <label htmlFor="email">
              Email Address
            </label>

            <input
              id="email"
              type="email"
              name="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="Enter your email"
              autoComplete="username"
              disabled={loading}
              required
            />

          </div>

          {/* PASSWORD */}

          <div className="login-field">

            <label htmlFor="password">
              Password
            </label>

            <div className="password-wrapper">

              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                name="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(
                    (previous) =>
                      !previous
                  )
                }
                disabled={loading}
              >
                {showPassword
                  ? "Hide"
                  : "Show"}
              </button>

            </div>

          </div>

          {/* SIGN IN */}

          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            {loading
              ? "Signing In..."
              : "Sign In"}
          </button>

        </form>

        {/* =================================================
            FOOTER
            ================================================= */}

        <div className="login-footer">

          <span>
            Chashma Plus Inventory
          </span>

          <span>
            Secure Admin Access
          </span>

        </div>

      </section>
    </main>
  );
};

export default Login;