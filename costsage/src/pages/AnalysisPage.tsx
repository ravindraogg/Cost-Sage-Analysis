import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
const base = import.meta.env.VITE_BASE_URL;

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

interface ChartOptions {
  responsive: boolean;
  plugins: {
    title: {
      display: boolean;
      text: string;
    };
  };
  scales: {
    y: {
      beginAtZero: boolean;
    };
  };
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
  const location = useLocation();
  const [isFetched, setIsFetched] = useState(false);

  useEffect(() => {
    const initialData = location.state?.analysis as AnalysisData[] || [];
    const initialInsights = location.state?.insights as string[] || [];
    if (initialData.length > 0 || initialInsights.length > 0) {
      setAnalysisData(initialData);
      setInsights(initialInsights);
      setLoading(false);
      setInsightsLoading(false);
      setIsFetched(true);
      return;
    }

    if (!expenseType || isFetched) return;

    const fetchAnalysisData = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found. Please log in.");

        const response = await axios.get(
          `${base}/api/expenses/analysis/${encodeURIComponent(expenseType || "")}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          const data = response.data.analysis as AnalysisData[] || [];
          console.log("Fetched analysis data:", JSON.stringify(data, null, 2));
          setAnalysisData(data);
          if (data.length > 0) {
            generateInsights(data);
          } else {
            setInsights(["No expense data available to generate insights."]);
            setInsightsLoading(false);
          }
        } else {
          throw new Error(response.data.message || "Failed to fetch analysis data");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch analysis data";
        console.error("Fetch error:", err);
        setError(errorMessage);
        setInsightsLoading(false);
      } finally {
        setLoading(false);
        setIsFetched(true);
      }
    };

    fetchAnalysisData();
  }, [expenseType, location.state]);

  const generateInsights = async (data: AnalysisData[]) => {
    setInsightsLoading(true);
    setInsightsError(null);

    try {
      if (!data || data.length === 0) {
        setInsights(["No expense data available to generate insights."]);
        setInsightsLoading(false);
        return;
      }

      const categories = data.map((item: AnalysisData) => item._id || "Unknown");
      const amounts = data.map((item: AnalysisData) => item.totalAmount || 0);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      const response = await axios.post(
        `${base}/api/insights`,
        {
          expenseType,
          categories,
          amounts,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        const cleanedInsights = response.data.insights
          .filter((insight: string) => insight.trim() && /^\d+\./.test(insight))
          .map((insight: string) => insight.trim());
        
        setInsights(
          cleanedInsights.length > 0
            ? cleanedInsights
            : ["No actionable insights could be generated."]
        );
      } else {
        throw new Error(response.data.message || "Failed to generate insights");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to generate insights. Please try again later.";
      console.error("Error generating insights:", err);
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
      colors.push(`rgba(${r}, ${g}, ${b}, 0.6)`);
    }
    return colors.length > 0 ? colors : ["rgba(0, 0, 0, 0.6)"];
  };

  const barChartData = {
    labels: analysisData.map((item: AnalysisData) => item._id || "Unknown"),
    datasets: [
      {
        label: "Total Amount",
        data: analysisData.map((item: AnalysisData) => item.totalAmount || 0),
        backgroundColor: generateColors(analysisData.length),
        borderColor: analysisData.map(() => "rgba(0, 0, 0, 1)"),
        borderWidth: 1,
      },
    ],
  };

  const lineChartData = {
    labels: analysisData.map((item: AnalysisData) => item._id || "Unknown"),
    datasets: [
      {
        label: "Total Amount",
        data: analysisData.map((item: AnalysisData) => item.totalAmount || 0),
        borderColor: "rgba(153, 102, 255, 1)",
        backgroundColor: "rgba(153, 102, 255, 0.2)",
        borderWidth: 2,
        fill: true,
      },
    ],
  };

  const pieChartData = {
    labels: analysisData.map((item: AnalysisData) => item._id || "Unknown"),
    datasets: [
      {
        label: "Total Amount",
        data: analysisData.map((item: AnalysisData) => item.totalAmount || 0),
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: `Expense Analysis for ${expenseType?.replace(/-/g, " ") || "Unknown"}`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

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
        Expense Analysis: {expenseType.replace(/-/g, " ")}
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
            <p className="no-data-message">No expense data available for this type.</p>
          ) : (
            <>
              <div className="chart-tabs">
                <button
                  className={`tab-button ${activeChart === "bar" ? "active" : ""}`}
                  onClick={() => setActiveChart("bar")}
                  style={{
                    background: activeChart === "bar" ? "linear-gradient(135deg, #4361ee, #00d4ff)" : "",
                    color: activeChart === "bar" ? "white" : "",
                  }}
                >
                  Bar Chart
                </button>
                <button
                  className={`tab-button ${activeChart === "line" ? "active" : ""}`}
                  onClick={() => setActiveChart("line")}
                  style={{
                    background: activeChart === "line" ? "linear-gradient(135deg, #4361ee, #00d4ff)" : "",
                    color: activeChart === "line" ? "white" : "",
                  }}
                >
                  Line Chart
                </button>
                <button
                  className={`tab-button ${activeChart === "pie" ? "active" : ""}`}
                  onClick={() => setActiveChart("pie")}
                  style={{
                    background: activeChart === "pie" ? "linear-gradient(135deg, #4361ee, #00d4ff)" : "",
                    color: activeChart === "pie" ? "white" : "",
                  }}
                >
                  Pie Chart
                </button>
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

            {!insightsLoading && insights.length > 0 ? (
              <div className="insights-content">
                {insights.map((insight: string, index: number) => {
                  const isNumbered = /^\d+\./.test(insight);
                  if (isNumbered) {
                    const [number, ...rest] = insight.split(".");
                    return (
                      <div key={index} className="insight-point">
                        <span className="insight-number">{number}.</span>
                        <span className="insight-text">{rest.join(".").trim()}</span>
                      </div>
                    );
                  }
                  return (
                    <div key={index} className="insight-point">
                      <span className="insight-text">{insight}</span>
                    </div>
                  );
                })}
              </div>
            ) : !insightsLoading && !insightsError ? (
              <div className="insights-empty">No insights available for this data.</div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
};

export default AnalysisPage;
export type { AnalysisData }; // Updated to export type
