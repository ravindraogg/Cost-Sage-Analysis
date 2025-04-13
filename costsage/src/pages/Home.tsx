import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faChartLine, faCogs, faRocket, faShieldAlt, faSignInAlt, 
  faUsers, faQuestionCircle, faRobot, faFileAlt
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import "./Home.css";
import Footer from "./Footer";
import dashboardImage from '/assets/image.png'; // Ensure this path is correct

const Home = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Mouse event handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const image = container.querySelector(".hero-image-content") as HTMLImageElement | null;
    if (!image) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const deltaX = (mouseX - centerX) / 20; // Scale down movement
    const deltaY = (mouseY - centerY) / 20;

    image.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const image = e.currentTarget.querySelector(".hero-image-content") as HTMLImageElement | null;
    if (image) {
      image.style.transition = "transform 0.1s ease";
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const image = e.currentTarget.querySelector(".hero-image-content") as HTMLImageElement | null;
    if (image) {
      image.style.transform = "translate(0, 0)";
      image.style.transition = "transform 0.3s ease";
      image.style.animation = "float 3s ease-in-out infinite";
    }
  };

  return (
    <div className="home-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h1>Cost-Sage</h1>
          </Link>
        </div>
        <div className={`navbar-links ${isMobileMenuOpen ? 'active' : ''}`}>
          <div className="nav-menu">
            <a href="#features" className="nav-link" onClick={toggleMobileMenu}>Features</a>
            <a href="#faq" className="nav-link" onClick={toggleMobileMenu}>FAQ</a>
          </div>
          <button className="login-button" onClick={() => { navigate("/login"); toggleMobileMenu(); }}>
            <FontAwesomeIcon icon={faSignInAlt} /> Login
          </button>
          <button className="signup-button" onClick={() => { navigate("/register"); toggleMobileMenu(); }}>
            Sign Up
          </button>
        </div>

        {/* Mobile menu toggle button */}
        <div className="mobile-menu-toggle" onClick={toggleMobileMenu}>
          <span className={isMobileMenuOpen ? "bar open" : "bar"}></span>
          <span className={isMobileMenuOpen ? "bar open" : "bar"}></span>
          <span className={isMobileMenuOpen ? "bar open" : "bar"}></span>
        </div>
      </nav>

      {/* Hero Section with Image */}
      <div className="hero-section">
        <div className="hero-content">
          <h2>Welcome to <span className="brand-highlight">Cost-Sage</span></h2>
          <p className="hero-subtitle">Your ultimate platform for cost-cutting strategies and AI-driven financial planning.</p>
          <div className="hero-buttons">
            <button className="get-started-button" onClick={() => navigate("/register")}>
              <FontAwesomeIcon icon={faRocket} /> Get Started
            </button>
          </div>
        </div>
        <div className="hero-image">
          <div
            className="image-container"
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="image-background"></div>
            <img
              src={dashboardImage} // Use the imported image
              alt="Dashboard Preview"
              className="hero-image-content"
            />
          </div>
        </div>
      </div>

      {/* Features Section with New Chatbot Feature */}
      <div id="features" className="features-section">
        <h3>Why Choose Cost-Sage?</h3>
        <div className="features-grid">
          <div className="feature">
            <FontAwesomeIcon icon={faChartLine} className="feature-icon" />
            <h4>AI-Powered Insights</h4>
            <p>Get actionable insights to optimize your spending and savings.</p>
          </div>
          <div className="feature">
            <FontAwesomeIcon icon={faCogs} className="feature-icon" />
            <h4>Streamlined Workflows</h4>
            <p>Automate and simplify your financial processes.</p>
          </div>
          <div className="feature">
            <FontAwesomeIcon icon={faShieldAlt} className="feature-icon" />
            <h4>Secure & Reliable</h4>
            <p>Your data is safe with our advanced security measures.</p>
          </div>
          <div className="feature">
            <FontAwesomeIcon icon={faUsers} className="feature-icon" />
            <h4>Collaborative Tools</h4>
            <p>Share insights with your team or family members.</p>
          </div>
          <div className="feature">
            <FontAwesomeIcon icon={faRobot} className="feature-icon" />
            <h4>Cost Analysis Chatbot</h4>
            <p>Upload financial files and get instant AI-powered insights and recommendations.</p>
          </div>
          <div className="feature">
            <FontAwesomeIcon icon={faFileAlt} className="feature-icon" />
            <h4>Document Analysis</h4>
            <p>Our AI analyzes your financial documents to identify savings opportunities.</p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="how-it-works">
        <h3>How Cost-Sage Works</h3>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h4>Sign Up</h4>
            <p>Create your account in less than 2 minutes</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h4>Connect Accounts</h4>
            <p>Securely link your financial data</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h4>Get Insights</h4>
            <p>Receive personalized recommendations</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h4>Save Money</h4>
            <p>Implement strategies and track progress</p>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div id="testimonials" className="testimonials-section">
        <h3>What Our Users Say</h3>
        <div className="testimonials-grid">
          <div className="testimonial">
            <div className="testimonial-content">
              <p>"Cost-Sage helped me save over $400 monthly on unnecessary expenses I didn't even know I had."</p>
            </div>
            <div className="testimonial-author">
              <div className="author-avatar"></div>
              <div className="author-info">
                <h5>Sarah Johnson</h5>
                <p>Small Business Owner</p>
              </div>
            </div>
          </div>
          <div className="testimonial">
            <div className="testimonial-content">
              <p>"The AI recommendations were spot-on. I've completely transformed my financial habits."</p>
            </div>
            <div className="testimonial-author">
              <div className="author-avatar"></div>
              <div className="author-info">
                <h5>Michael Chen</h5>
                <p>Software Engineer</p>
              </div>
            </div>
          </div>
          <div className="testimonial">
            <div className="testimonial-content">
              <p>"The new chatbot feature analyzed my expenses and found savings I never would have discovered on my own."</p>
            </div>
            <div className="testimonial-author">
              <div className="author-avatar"></div>
              <div className="author-info">
                <h5>Emily Rodriguez</h5>
                <p>Marketing Director</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="cta-section">
        <h3>Ready to Optimize Your Finances?</h3>
        <p>Join thousands of users who have transformed their financial future with Cost-Sage.</p>
        <button className="cta-button" onClick={() => navigate("/register")}>
          Start Your Free Trial
        </button>
      </div>

      {/* FAQ Section */}
      <div id="faq" className="faq-section">
        <h3>Frequently Asked Questions</h3>
        <div className="faq-container">
          <div className="faq-item">
            <div className="faq-question">
              <FontAwesomeIcon icon={faQuestionCircle} />
              <h4>How does Cost-Sage protect my financial data?</h4>
            </div>
            <div className="faq-answer">
              <p>We use bank-level encryption and never store your account credentials. Our platform is SOC 2 compliant and regularly audited for security.</p>
            </div>
          </div>
          <div className="faq-item">
            <div className="faq-question">
              <FontAwesomeIcon icon={faQuestionCircle} />
              <h4>Can I use Cost-Sage for my business?</h4>
            </div>
            <div className="faq-answer">
              <p>Absolutely! We offer specialized business plans with features designed for expense management, budgeting, and financial forecasting for companies of all sizes.</p>
            </div>
          </div>
          <div className="faq-item">
            <div className="faq-question">
              <FontAwesomeIcon icon={faQuestionCircle} />
              <h4>How does the Cost Analysis Chatbot work?</h4>
            </div>
            <div className="faq-answer">
              <p>Simply upload your financial documents or statements, and our AI-powered chatbot will analyze the data to identify spending patterns, suggest savings opportunities, and provide personalized financial advice.</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Home;