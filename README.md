
# ElectraTrade B2B E-Commerce Platform

A high-performance MERN stack marketplace connecting electronics manufacturers with retail shop owners. Features professional trade logic, net-30 credit systems, and Gemini AI-powered demand forecasting.

## 🚀 Features

- **RBAC (Role-Based Access Control)**: Secure portals for Manufacturers, Shop Owners, and Admins.
- **B2B Trade Logic**: Supports "Net-30" trade credit and bulk ordering with MOQs (Minimum Order Quantities).
- **AI Integration**: Uses Google Gemini to predict stock demand and recommend components to retailers.
- **Financial Oversight**: Admin panel for platform profit tracking, user verification, and commission management.
- **Scalable Backend**: Built with Node.js, Express, and MongoDB (Mongoose).

## 🛠️ Tech Stack

- **Frontend**: React (v19), Tailwind CSS, React Router 7.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB.
- **Security**: JWT Authentication, Bcrypt password hashing.
- **AI**: Google Generative AI (Gemini API).

## 📦 Setup Instructions

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd electratrade
npm install
```

### 2. Environment Variables
Create a `.env` file in the root:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/electratrade
JWT_SECRET=your_secure_jwt_secret_key
API_KEY=your_google_gemini_api_key
```

### 3. Run the Platform
**Start Backend (Terminal 1):**
```bash
npm run dev
```

**Start Frontend (Terminal 2):**
```bash
# Assuming you are using a standard React dev server
npm start
```

## 🔐 Demo Credentials
- **Admin**: `admin@electratrade.com`
- **Manufacturer**: `info@siliconmicro.com`
- **Shop Owner**: `buyer@elitegear.com`
*(Note: All demo accounts use a placeholder bypass in the dev environment)*

## 📄 License
MIT License - Created for professional B2B electronics trade demonstration.
