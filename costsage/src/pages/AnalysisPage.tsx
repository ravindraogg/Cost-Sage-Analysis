import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import LoadingCoin from "./LoadingCoin";
import "./AnalysisPage.css";

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface AnalysisData {
  _id: string; // Category
  totalAmount: number;
  count: number;
}

const AnalysisPage = () => {
  const { expenseType } = useParams<{ expenseType: string }>();
  const [analysisData, setAnalysisData] = useState<AnalysisData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [activeChart, setActiveChart] = useState<"bar" | "line" | "pie">("bar");
  const navigate = useNavigate();

  // Early return for invalid expenseType
  if (!expenseType) {
    return (
      <div className="analysis-container">
        <h1>Error: Expense Type Not Found</h1>
        <p>Please go back to the dashboard and try again.</p>
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  useEffect(() => {
    const fetchAnalysisData = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found. Please log in.");

        const response = await axios.get(
          ${import.meta.env.VITE_BASE_URL}/api/expenses/analysis/${encodeURIComponent(expenseType)},
          { headers: { Authorization: Bearer ${token} } }
        );

        console.log("API Response:", response.data);
        if (response.data.success && Array.isArray(response.data.analysis)) {
          setAnalysisData(response.data.analysis);
          if (response.data.analysis.length > 0) {
            await generateInsights(response.data.analysis);
          } else {
            setInsights(["No expense data available to generate insights."]);
            setInsightsLoading(false);
          }
        } else {
          throw new Error(response.data.message || "Invalid analysis data");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch analysis data";
        console.error("Fetch error:", err.response?.data || err);
        setError(errorMessage);
        setInsightsLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysisData();
  }, [expenseType]);

  const generateInsights = async (data: AnalysisData[]) => {
    setInsightsLoading(true);
    setInsightsError(null);

    try {
      if (!data || data.length === 0) {
        setInsights(["No expense data available to generate insights."]);
        setInsightsLoading(false);
        return;
      }

      const categories = data.map((item) => item._id || "Unknown");
      const amounts = data.map((item) => item.totalAmount || 0);

      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found. Please log in.");

      const response = await axios.post(
        ${import.meta.env.VITE_BASE_URL}/api/insights,
        { expenseType, categories, amounts },
        { headers: { Authorization: Bearer ${token}, "Content-Type": "application/json" } }
      );

      console.log("Insights Response:", response.data);
      if (response.data.success && Array.isArray(response.data.insights)) {
        const cleanedInsights = response.data.insights
          .filter((insight: string) => insight.trim())
          .map((insight: string) => {
            const match = insight.match(/^\d+\.\s*(.*)/);
            return match ? match[1].trim() : insight.trim();
          });
        setInsights(cleanedInsights.length > 0 ? cleanedInsights : ["No actionable insights generated."]);
      } else {
        throw new Error(response.data.message || "Failed to generate insights");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate insights. Please try again later.";
      console.error("Insights error:", err);
      setInsightsError(errorMessage);
      setInsights(["Unable to generate insights at this time."]);
    } finally {
      setInsightsLoading(false);
    }
  };

  const generateColors = (count: number) => {
    const colors = [];
    for (let i = 0; i < count; i++) {
      const r = Math.floor(Math.random() * 256);
      const g = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      colors.push(rgba(${r}, ${g}, ${b}, 0.6));
    }
    return colors;
  };

  const barChartData = {
    labels: analysisData.map((item) => item._id || "Unknown"),
    datasets: [
      {
        label: "Total Amount",
        data: analysisData.map((item) => item.totalAmount || 0),
        backgroundColor: generateColors(analysisData.length),
        borderColor: analysisData.map(() => "rgba(0, 0, 0, 1)"),
        borderWidth: 1,
      },
    ],
  };

  const lineChartData = {
    labels: analysisData.map((item) => item._id || "Unknown"),
    datasets: [
      {
        label: "Total Amount",
        data: analysisData.map((item) => item.totalAmount || 0),
        borderColor: "rgba(153, 102, 255, 1)",
        backgroundColor: "rgba(153, 102, 255, 0.2)",
        borderWidth: 2,
        fill: true,
      },
    ],
  };

  const pieChartData = {
    labels: analysisData.map((item) => item._id || "Unknown"),
    datasets: [
      {
        label: "Total Amount",
        data: analysisData.map((item) => item.totalAmount || 0),
        backgroundColor: generateColors(analysisData.length),
        borderColor: generateColors(analysisData.length).map((c) => c.replace("0.6", "1")),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: Expense Analysis for ${expenseType?.replace(/-/g, " ") || "Unknown"},
      },
      legend: {
        display: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        display: true,
        title: {
          display: true,
          text: "Amount ($)",
        },
      },
      x: {
        display: true,
        title: {
          display: true,
          text: "Categories",
        },
      },
    },
  };

  return (
    <div className="analysis-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>Cost-Sage</h1>
        </div>
        <div className="navbar-links">
          <button className="back-button" onClick={() => navigate("/dashboard")}>
            ← Back to Dashboard
          </button>
        </div>
      </nav>

      <h1 style={{ textTransform: "capitalize" }}>
        Expense Analysis: {expenseType?.replace(/-/g, " ") || "Unknown"}
      </h1>

      {loading && (
        <div className="centered-loading">
          <LoadingCoin size="medium" text="Loading analysis data..." />
        </div>
      )}
      {error && <p className="error-message">Error: {error}</p>}

      {!loading && !error && (
        <>
          {analysisData.length === 0 ? (
            <div className="no-data-message">
              <p>No data available for analysis. Add expenses to see charts and insights.</p>
            </div>
          ) : (
            <>
              <div className="chart-tabs">
                {["bar", "line", "pie"].map((chartType) => (
                  <button
                    key={chartType}
                    className={tab-button ${activeChart === chartType ? "active" : ""}}
                    onClick={() => setActiveChart(chartType as "bar" | "line" | "pie")}
                    style={{
                      background: activeChart === chartType ? "linear-gradient(135deg, #4361ee, #00d4ff)" : "",
                      color: activeChart === chartType ? "white" : "",
                    }}
                  >
                    {chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart
                  </button>
                ))}
              </div>

              <div className="chart-container">
                {activeChart === "bar" && <Bar data={barChartData} options={chartOptions} />}
                {activeChart === "line" && <Line data={lineChartData} options={chartOptions} />}
                {activeChart === "pie" && <Pie data={pieChartData} options={chartOptions} />}
              </div>
            </>
          )}

          <div className="insights-card">
            <div className="insights-header">
              <h2>AI Insights</h2>
              {insightsLoading && (
                <div className="insights-loader">
                  <LoadingCoin size="small" text="Generating insights..." />
                </div>
              )}
            </div>

            {insightsError && <p className="error-message">Error: {insightsError}</p>}

            {!insightsLoading && (
              <>
                {insights.length > 0 ? (
                  <div className="insights-content">
                    {insights.map((insight, index) => (
                      <div key={index} className="insight-point">
                        <span className="insight-text">{insight}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="insights-empty">No insights available for this data.</div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AnalysisPage;
