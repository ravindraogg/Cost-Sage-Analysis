import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Dashboard.css";
import FullScreenLoading from "./FullScreenLoading";
import LoadingCoin from "./LoadingCoin";
import costAnalysisChatbotImage from './../../assets/chat-icon.gif';
import expenseTrackerImage from './../../assets/expense-tracker.png';
import businessExpenseImage from './../../assets/business-expense.png';
import personalExpenseImage from './../../assets/personal-expense.png';
import dailyExpenseImage from './../../assets/daily-expense.png';
import otherExpensesImage from './../../assets/other-expenses.png';
const base = import.meta.env.VITE_BASE_URL;

interface Expense {
  id: number;
  date: string;
  category: string;
  amount: number;
  description: string;
  expenseType: string;
}

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [, setUserEmail] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const expenseTypes = [
    {
      name: "Cost Analysis Chatbot",
      img: costAnalysisChatbotImage,
      description: "Upload financial files and get instant AI-powered insights and recommendations.",
      isFreemium: true,
    },
    {
      name: "Full Expense Tracker",
      img: expenseTrackerImage,
      description: "Track all your expenses in one place",
    },
    {
      name: "Business Expense Tracker",
      img: businessExpenseImage,
      description: "Manage your business-related expenses",
    },
    {
      name: "Personal Expense Tracker",
      img: personalExpenseImage,
      description: "Keep track of your personal spending",
    },
    {
      name: "Daily Expense Tracker",
      img: dailyExpenseImage,
      description: "Monitor your daily expenditures",
    },
    {
      name: "Other Expenses",
      img: otherExpensesImage,
      description: "Track miscellaneous expenses",
    },
  ];
  
  useEffect(() => {
    const init = async () => {
      const storedUsername = localStorage.getItem("username");
      const storedUserEmail = localStorage.getItem("userEmail");

      if (storedUsername) {
        setUsername(storedUsername);
      }
      if (storedUserEmail) {
        setUserEmail(storedUserEmail);
      }

      await fetchRecentExpenses();
      setPageLoading(false);
    };
    init();
  }, []);

  const fetchRecentExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No auth token found");
      }

      const response = await axios.get(`${base}/api/expenses/recent`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        console.log("Fetched expenses:", response.data.expenses);
        setExpenses(response.data.expenses);
      } else {
        throw new Error("Failed to fetch expenses");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch expenses";
      console.error("Failed to fetch expenses:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const goToExpenseTracker = (featureName: string) => {
    setPageLoading(true);
    if (featureName === "Cost Analysis Chatbot") {
      navigate("/chat");
    } else {
      const formattedFeature = featureName.toLowerCase().replace(/\s+/g, "-");
navigate(`/expense/${formattedFeature}`);
    }
  };

  const handleLogout = async () => {
    try {
      setPageLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No auth token found");
      }

      const response = await axios.post(
        `${base}/api/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("userEmail");
        navigate("/");
      } else {
        throw new Error("Logout failed");
      }
    } catch (err) {
      console.error("Logout error:", err);
      alert("Failed to logout. Please try again.");
      setPageLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <FullScreenLoading 
        isLoading={pageLoading} 
        message="Loading Cost-Sage..." 
        coinSize="large" 
      />
      
      <div className="dashboard-container">
        <nav className="navbar">
          <div className="navbar-left">
            <Link to="/" className="brand-highlight">
            <h1 className="website-name">Cost-Sage</h1>
            </Link>
          </div>
          <span className="username">Welcome, {username}</span>
          <div className="navbar-right">
            <button className="hamburger-button" onClick={toggleSidebar}>
              ☰
            </button>
          </div>
        </nav>

        <div className={`floating-sidebar ${isSidebarOpen ? "open" : ""}`}>
          <ul className="sidebar-menu">
            {expenseTypes.map((feature) => (
              <li 
                key={feature.name} 
                onClick={() => goToExpenseTracker(feature.name)}
                className={feature.isFreemium ? "freemium-feature" : ""}
              >
                {feature.name}
              </li>
            ))}
            <li>
              <button className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </li>
          </ul>
        </div>

        <div className="main-section">
          <div className="feature-cards">
            {expenseTypes.map((feature) => (
              <div
                className={`feature-card ${feature.isFreemium ? "freemium-card" : ""}`}
                key={feature.name}
                onClick={() => goToExpenseTracker(feature.name)}
              >
                <img src={feature.img} alt={feature.name} className="card-image" />
                <div className="card-content">
                  <h2>{feature.name}</h2>
                  <p>{feature.description}</p>
                  {feature.name === "Cost Analysis Chatbot" && (
                    <p className="sub-feature">
                      <strong>Document Analysis:</strong> Our AI analyzes your financial documents to identify savings opportunities.
                    </p>
                  )}
                  {feature.isFreemium && (
                    <button className="cta-button">
                      Start Free Now!
                    </button>
                  )}
                </div>
                {feature.isFreemium && <span className="freemium-badge">Freemium!</span>}
              </div>
            ))}
          </div>

          <div className="recent-expenses">
            <h2>Recent Expenses Across All Categories</h2>
            <div className="expense-history">
              {loading && (
                <div className="centered-loading">
                  <LoadingCoin size="medium" text="Loading expenses..." />
                </div>
              )}
              {error && <p className="error-message">Error: {error}</p>}
              {!loading && !error && expenses.length === 0 && (
                <p>No recent expenses found. Start adding expenses to see them here!</p>
              )}
              {!loading && !error && expenses.length > 0 && (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense, index) => (
                      <tr key={expense.id || index}>
                        <td>{formatDate(expense.date)}</td>
                        <td>{expense.category}</td>
                        <td>{expense.expenseType}</td>
                        <td>{expense.description}</td>
                        <td>₹{expense.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
