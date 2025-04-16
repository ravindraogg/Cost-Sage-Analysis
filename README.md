<div align="center">
  <img 
    src="https://github.com/user-attachments/assets/6466eea4-2bfd-4010-8a9a-a4e0e737e571" 
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

## ✨ Features

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

---

## 🛠 Tech Stack

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#f5f7fa', 'edgeLabelBackground':'#fff'}}}%%
flowchart LR
    subgraph Frontend
        A[React 18] --> B[TypeScript]
        A --> C[Chart.js]
        A --> D[React Router]
    end
    
    subgraph Backend
        E[Express.js] --> F[MongoDB]
        E --> G[JWT Auth]
        E --> H[Multer]
    end
    
    subgraph AI
        I[groq NLP]
        J[AWS Textract]
    end
    
    Frontend -- REST API --> Backend
    Backend -- Process --> AI
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18.x
- MongoDB Atlas account
- groq API key

### Installation

```bash
# 1. Clone repo
git clone https://github.com/yourusername/cost-sage-analysis-pro.git
cd cost-sage-analysis-pro

# 2. Install dependencies
npm install

# 3. Configure environment
echo "MONGODB_URI=your_mongo_connection_string" >> .env
echo "groq_API_KEY=your_groq_key" >> .env

# 4. Start application
npm run dev
```

---

## 📁 Project Structure

```
costsage-pro/
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

MIT License © 2024 Your Team

---

<div align="center">
  <h3>💡 Contributors Welcome!</h3>
  <p>
    <a href="#">
      <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen" alt="PRs Welcome">
    </a>
    <a href="#">
      <img src="https://img.shields.io/github/issues/yourrepo/cost-sage-analysis-pro" alt="Issues">
    </a>
  </p>
</div>
