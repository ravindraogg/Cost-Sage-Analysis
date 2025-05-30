import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import LoadingCoin from "./LoadingCoin"; // Import the LoadingCoin component
import "./Login.css";
import Footer from "./Footer";
const base = import.meta.env.VITE_BASE_URL;

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true); // Start loading animation
    
    if (!formData.email || !formData.password) {
      setError("All fields are required.");
      setIsLoading(false); // Stop loading animation
      return;
    }

    try {
      const response = await axios.post(`${base}/api/login`, formData);

      if (response.data.success) {
        // Store token for authentication
        localStorage.setItem("token", response.data.token);
        // Store user's name from the user object in the response
        localStorage.setItem("username", response.data.user.name);
        // Optionally store other user data if needed
        localStorage.setItem("userEmail", response.data.user.email);
        navigate("/dashboard");
      } else {
        setError("Invalid credentials. Please try again.");
        setIsLoading(false); // Stop loading animation
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        // Handle specific error messages from the server
        setError(err.response.data.message || "Login failed. Please try again.");
      } else {
        setError(err instanceof Error ? err.message : "Login failed. Please try again.");
      }
      setIsLoading(false); // Stop loading animation
    }
  };

  const handleGoBack = () => {
    navigate(-1); // Go back to the previous page
  };

  return (
    <div className="div">
      <nav className="navbar">
        <div className="navbar-brand">
        <Link to="/" className="brand-highlight">
          <h1>Cost-Sage</h1>
          </Link>
        </div>
        <div className="navbar-links">
          <button className="go-back-button" onClick={handleGoBack}>
            ← Go Back
          </button>
        </div>
      </nav>
      <div className="login-container">
        <div className="login-content">
          {/* Login form aligned to the left */}
          <div className="login-form-container">
            <h2>Login to Cost-Sage</h2>
            <form onSubmit={handleSubmit}>
              {error && <p className="error-message">{error}</p>}
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                />
              </div>
              <button type="submit" className="login-button" disabled={isLoading}>
                {isLoading ? (
                  <LoadingCoin text="Logging in..." />
                ) : (
                  "Login"
                )}
              </button>
            </form>
            <p className="register-link">
              Don't have an account? <a href="/register">Register here</a>
            </p>
          </div>

          {/* Cool shape in the top-right corner */}
          <div className="cool-shape"></div>
        </div>
      </div>
      <Footer/>
    </div>
  );
};

export default Login;