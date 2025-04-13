import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import LoadingCoin from "./LoadingCoin";
import "./Register.css";
import Footer from "./Footer";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    companyName: "",
    industry: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!formData.name || !formData.email || !formData.password || !formData.companyName || !formData.industry) {
      setError("All fields are required.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post("https://backedncostsage-g3exe0b2gwc0fba8.canadacentral-01.azurewebsites.net/api/register", formData);
      console.log("API Response:", response.data); // Debug the response
      const storedUsername = response.data.username || response.data.name || formData.name;
      console.log("Storing username:", storedUsername); // Debug the value being stored
      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("username", storedUsername);
        localStorage.setItem("userEmail", response.data.email || formData.email);
        navigate("/dashboard");
      } else {
        setError("Registration failed: " + (response.data.message || "Unknown error"));
        setIsLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
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
      <div className="register-container">
        <h2>Register for Cost-Sage</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className="error-message">{error}</p>}
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>
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
          <div className="form-group">
            <label>Company Name</label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Enter your company name"
              required
            />
          </div>
          <div className="form-group">
            <label>Industry</label>
            <select name="industry" value={formData.industry} onChange={handleChange} required>
              <option value="">Select your industry</option>
              <option value="Finance">Finance</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Retail">Retail</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Technology">Technology</option>
            </select>
          </div>
          <button type="submit" className="register-button" disabled={isLoading}>
            {isLoading ? (
              <LoadingCoin text="Registering..." />
            ) : (
              "Register"
            )}
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default Register;