Gemini said
To make your GitHub repository look professional, your README should be clear, welcoming, and easy to follow. Here is a concise, human-toned README template including the manual setup instructions for VS Code.

🌐 BudgetSphere: Your AI-Powered Finance Sidekick
BudgetSphere isn't just another boring expense tracker. It’s a smart tool designed to take the stress out of money management. By combining a fast FastAPI backend with a sleek React frontend, it helps you track spending, set goals, and even ask an AI if you can actually afford that new pair of shoes.

✨ What’s Inside?
Talk to your data: Add expenses using natural language (e.g., "Spent 20 on lunch").

Affordability Check: A smart tool that tells you if a purchase fits your current budget.

Goal Tracking: Keep an eye on your savings targets with live progress bars.

Clean Dashboard: A simple, high-level view of your financial health.

🛠️ How to Run This Locally (VS Code)
If you've just downloaded the project and want to get it running on your machine, follow these steps:

1. Prerequisites
Install Python 3.9+

Install Node.js (latest LTS version)

A MongoDB account (or local Compass) to store your data.

2. Backend Setup (FastAPI)
Open your terminal in VS Code and navigate to the backend folder:

Bash
cd backend
Create a virtual environment:

Bash
python -m venv venv
Activate it:

Windows: venv\Scripts\activate

Mac/Linux: source venv/bin/activate

Install the required packages:

Bash
pip install -r requirements.txt
Start the server:

Bash
python server.py
3. Frontend Setup (React)
Open a new terminal tab in VS Code and go to the frontend folder:

Bash
cd frontend
Install the dependencies:

Bash
npm install
Launch the app:

Bash
npm start
4. Viewing the App
Once both are running, open your browser and go to: http://localhost:3000

💡 Tech Stack
Frontend: React, Tailwind CSS, Shadcn/UI

Backend: FastAPI, Python, Motor (Async MongoDB)

Security: JWT Authentication & Bcrypt hashing
