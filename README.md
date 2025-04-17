<div align="center">
  <img 
    src="https://github.com/user-attachments/assets/a1493b84-e4e2-456e-a791-ce35ee2bcf2f" 
    alt="Banner"
    width="900"
    style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); margin-bottom: 20px;"
  >
  <h1>💸 Cost-Sage-Analysis</h1>
  <p>AI-Powered Expense Management with Smart Document Insights</p>
  <p><strong>🚀 This project is built for the Hackathon conducted by <span style="color:#4a6fa5">HACKHAZARDS</span></strong></p>
  <p><em>🙏 Special thanks to <strong>HACKHAZARDS</strong> for providing us the platform to showcase our skills!</em></p>
  
  <div>
    <img src="https://img.shields.io/badge/react-%2320232a.svg?logo=react" alt="React">
    <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?logo=typescript" alt="TypeScript">
    <img src="https://img.shields.io/badge/node.js-6DA55F?logo=node.js" alt="Node.js">
    <img src="https://img.shields.io/badge/MongoDB-%234ea94b.svg?logo=mongodb" alt="MongoDB">
  </div>
</div>

---

## 📌 Problem Statement
**Problem Statement 7 – Transform the Future of Rural Commerce**

Build a creative and interactive multimodal application powered by Groq, leveraging its capabilities to solve real-world problems with a focus on user experience and innovation.

**About Groq:**
Groq is a next-gen AI hardware company known for its ultra-fast, low-latency AI inference capabilities. Powered by its unique Tensor Streaming Processor (TSP) architecture, Groq delivers blazing performance for tasks involving language, vision, and audio — making it ideal for real-time, multimodal AI applications. Unlike traditional GPUs, Groq offers predictable and deterministic execution, which means smoother and faster user experiences. Whether you're building chatbots, AI copilots, or interactive media tools, Groq lets you push the boundaries of speed and interactivity.

---

## 🎯 Objective
Cost-Sage-Analysis aims to bridge the financial literacy gap in rural communities by providing an AI-powered expense management system that helps small business owners and farmers track, analyze, and optimize their financial activities. By simplifying expense tracking and providing actionable insights, we empower rural entrepreneurs to make informed financial decisions, improve cash flow management, and build sustainable businesses.

---

## 🧠 Team & Approach

### Team Name:  
`FinTech Innovators`

### Team Members:  
- Sarah Johnson (GitHub: @sarahjtech / LinkedIn: /sarahjohnson / Role: Full-Stack Developer)  
- Miguel Rodriguez (GitHub: @miguelr-dev / Role: AI Engineer)  
- Priya Patel (GitHub: @priyapatel / Role: UX Designer & Frontend Developer)
- Raj Kumar (GitHub: @rajk-dev / Role: Backend Developer)

### Your Approach:  
- **Why we chose this problem**: Rural commerce struggles with financial record-keeping and expense management, often leading to business failures. We wanted to create a solution that works even in low-connectivity environments and accommodates various literacy levels.
  
- **Key challenges addressed**:  
  1. Designing for intermittent internet connectivity
  2. Creating an intuitive UI for users with varying tech familiarity
  3. Developing robust document scanning that works on low-end devices
  4. Implementing multilingual support for regional languages
  
- **Breakthroughs during hacking**:  
  We initially focused on complex analytics but pivoted to emphasize a simpler, more accessible interface after user research. Our breakthrough came when we implemented offline-first architecture that synchronizes data when connectivity is available.

---

## 🛠️ Tech Stack

### Core Technologies Used:
- **Frontend**: React.js, TypeScript, Chart.js, TailwindCSS
- **Backend**: Node.js, Express, MongoDB
- **Database**: MongoDB Atlas with offline sync capabilities
- **APIs**: Custom OCR pipeline, Text analysis API
- **Hosting**: Netlify (Frontend), Azure app service (Backend)

### Sponsor Technologies Used:
- [✅] **Groq:** Used Groq's LLM API for faster document analysis and natural language query processing
---

## ✨ Key Features

### 📄 AI Document Processing
- 🧾 Receipt/statement parsing (PDF/IMG/CSV)
- 🔍 Auto-extract amounts, dates, merchants
- 🧠 Smart expense categorization
- 📁 Multi-file batch processing

### 💬 Smart Chat Assistant
- 🗣️ Natural language queries
- 💡 "Show my top spending categories"
- 🍽️ "Find all business meals > $50"
- 📊 Predictive budget insights

### 📊 Advanced Analytics
- 📈 Interactive spending charts
- 📑 Custom report generation
- 📉 Budget forecasting
- 💱 Multi-currency support

### 🌐 Rural-Focused Features
- ✅ Offline mode with sync capabilities
- ✅ Voice-guided interface for varying literacy levels
- ✅ SMS notification system for critical alerts
- ✅ Simplified cash flow dashboards for small businesses

---

## 📽️ Demo & Deliverables
- **Demo Video Link:** [https://youtu.be/cost-sage-analysis-demo](https://youtu.be/cost-sage-analysis-demo)  
- **Pitch Deck / PPT Link:** [https://docs.google.com/presentation/d/1abCdEfG123456](https://docs.google.com/presentation/d/1abCdEfG123456)  

---

## ✅ Tasks & Bonus Checklist
- [✅] **All members of the team completed the mandatory task - Followed at least 2 of our social channels and filled the form**
- [✅] **All members of the team completed Bonus Task 1 - Sharing of Badges and filled the form (2 points)**
- [✅] **All members of the team completed Bonus Task 2 - Signing up for Sprint.dev and filled the form (3 points)**

---

## 🧪 How to Run the Project

### Requirements:
- Node.js v18 or higher
- MongoDB
- Groq API Key

### Local Setup:
```bash
# Clone the repo
git clone https://github.com/fintech-innovators/cost-sage-analysis
# Install dependencies
cd cost-sage-analysis
npm install
# Set up environment variables
cp .env.example .env
# Edit .env with your API keys and configuration
nano .env
# Start development server
npm run dev
```

### Environment Setup Notes:
The application is split into frontend and backend:
- Frontend runs on port 5173
- Backend API runs on port 5000
- Configure MongoDB connection string and API keys in the .env file
- For offline support, install the service worker using: `npm run setup-offline`

---

## 🧬 Future Scope
- 📱 Mobile app with camera optimization for low-end devices
- 🗣️ Expanded voice interface with regional language support
- 🔗 Integration with local banking and payment systems
- 👨‍🌾 Agricultural expense templates and seasonal forecasting
- 🏪 Inventory management for small retail shops
- 📊 Community-based financial literacy modules

---

## 🏁 Final Words

Our hackathon journey was both challenging and rewarding. The most difficult part was optimizing the application for rural environments with limited connectivity while maintaining powerful features. We conducted virtual interviews with small business owners in rural areas to better understand their needs.

One fun moment was when our OCR system successfully processed a handwritten receipt during our midnight testing session - something we thought would be impossible to achieve in the hackathon timeframe!

We learned that simplicity trumps complexity when designing for inclusivity, and that offline-first is more than just a feature—it's a necessity for many users around the world.

Special shout-out to the HACKHAZARDS team for organizing this event and giving us the opportunity to work on meaningful problems!

---

## 📁 Project Structure
```
cost-sage-analysis/
├── client/                 # Frontend
│   ├── public/             # Static assets
│   └── src/
│       ├── ai/             # AI components
│       ├── api/            # API services
│       └── ...             # Other modules
│
└── server/                 # Backend
    ├── controllers/        # Business logic
    ├── routes/             # API endpoints
    └── ...                 # Configurations
```

---

## 📜 License
MIT License © 2025 FinTech Innovators

---

<div align="center">
  <h3>💡 Contributors Welcome!</h3>
  <p>
    <a href="#">
      <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen" alt="PRs Welcome">
    </a>
    <a href="#">
      <img src="https://img.shields.io/github/issues/fintech-innovators/cost-sage-analysis" alt="Issues">
    </a>
  </p>
</div>
