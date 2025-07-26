# bioword

Biology Word Breaker
A web application that breaks down biology terms into their prefix, root, and suffix components using AI-powered analysis.

Features
AI-Powered Analysis: Uses Google's Gemini AI to analyze biology terms
Component Breakdown: Shows prefix, root, and suffix with detailed meanings
Database Storage: Saves all word breakdowns and tracks popular terms
Popular Terms: Displays most searched biology terms for easy discovery
Search History: Tracks user searches and analytics
Responsive Design: Works on desktop and mobile devices
Tech Stack
Frontend: HTML5, Tailwind CSS, Vanilla JavaScript
Backend: Node.js with custom HTTP server
Database: PostgreSQL with three tables for data persistence
AI Integration: Google Generative AI (Gemini)
Hosting: Optimized for Vercel deployment
Local Development
Install dependencies:

npm install
Set up environment variables:

GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=your_postgresql_url
Run the server:

node app.js
Open http://localhost:5000

Database Schema
word_breakdowns
Stores analyzed biology terms with their components
Fields: original_word, prefix, root, suffix, meanings, timestamps
search_history
Tracks user searches with IP addresses and success status
Used for analytics and debugging
popular_terms
Maintains search frequency and ranking
Updates automatically with each search
Deployment
This app is configured for easy deployment on Vercel with:

Automatic PostgreSQL database provisioning
Environment variable management
Serverless function optimization
API Endpoints
GET /api/key - Returns Gemini API key
POST /api/breakdown - Saves word breakdown to database
GET /api/popular - Returns most searched terms
GET /api/history - Returns recent search history
GET /api/search?q=term - Searches existing breakdowns
