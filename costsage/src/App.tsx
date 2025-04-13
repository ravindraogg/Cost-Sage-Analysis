import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./pages/register"; // Import the Register component
import Login from "./pages/Login";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ExpenseTrackingPage from "./pages/expense";
import AnalysisPage from "./pages/AnalysisPage";
import AboutUs from "./pages/AboutUs";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} /> 
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/expense/:feature" element={<ExpenseTrackingPage />} />
        <Route path="/analysis/:expenseType" element={<AnalysisPage />} />
        <Route path="/about" element={<AboutUs />} />
      </Routes>
    </Router>
  );
};

export default App;
