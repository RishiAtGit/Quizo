Quizo - Real-Time Quiz Platform 🚀

![Capture](https://github.com/user-attachments/assets/c3a23302-ed7b-4c60-91f9-c0630be832d1)
![Capture2](https://github.com/user-attachments/assets/8c0d5ac6-34e5-4719-8909-a03fe3d47bab)
![Capture3](https://github.com/user-attachments/assets/a769e9b4-83c8-4e6f-bff2-2f9aa4045f6b)



<p align="center">
A live, interactive, and full-stack quiz application where hosts can create custom quizzes and players can compete in real-time. The winner is determined by who answers correctly in the shortest amount of time.
</p>

<p align="center">
<strong><a href="https://quizo-flax.vercel.app/">🎮 Try Quizo Live! 🎮</a></strong>
</p>

✨ Features
Real-Time Gameplay: Uses WebSockets to instantly sync game state across all clients.

Custom Quiz Creation: Hosts can create their own quizzes with multiple questions and answers.

Dynamic Roles: A distinct "Host" role to control the game and a "Player" role to compete.

Player Avatars: Players can choose a fun avatar to represent them.

Time-Based Scoring: The leaderboard ranks players based on the cumulative time taken to answer correctly.

Interactive UI: A modern and playful UI with a dynamic background, custom fonts, and animations.

Fully Deployed: The application is live and accessible to anyone online.

🛠️ Technology Stack & Architecture
This project was built with a modern, decoupled architecture, with the backend and frontend developed and deployed independently.

Backend (/backend)
Language: Python

Framework: FastAPI (for its high-performance, asynchronous capabilities)

Real-Time Communication: WebSockets

Server: Uvicorn (ASGI Server)

Data Validation: Pydantic

Dependency Management: pip with requirements.txt

Frontend (/frontend)
Library: React (with Hooks)

WebSocket Client: react-use-websocket

Styling: Custom CSS3 with animations and custom fonts

Package Manager: npm

Deployment & Infrastructure
Version Control: Git & GitHub

Backend Hosting: Render (Platform-as-a-Service)

Frontend Hosting: Vercel

Networking: CORS (Cross-Origin Resource Sharing) configuration

🚀 Getting Started: Running Locally
To run this project on your local machine, please follow these steps.

Prerequisites
Python 3.8+

Node.js and npm

Git

1. Clone the Repository
git clone [https://github.com/RishiAtGit/Quizo.git](https://github.com/RishiAtGit/Quizo.git)
cd Quizo

2. Set Up and Run the Backend
You'll need one terminal for this.

# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload

The backend will now be running at http://127.0.0.1:8000.

3. Set Up and Run the Frontend
You'll need a second, separate terminal for this.

# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Run the React app
npm start

Your browser will automatically open to http://localhost:3000, and the application will be running.

🌟 Key Learnings
This project was a fantastic exercise in building a complete web application from scratch. Key takeaways include:

Architecting a real-time system with WebSockets.

Building a decoupled frontend and backend.

The importance of robust data validation with Pydantic.

Crucially, diagnosing and solving real-world deployment issues, particularly the CORS errors that arise when connecting separate frontend and backend services hosted on different domains.

🧑‍💻 Author
Developed with ❤️ by Rishi Raj.

Feel free to connect with me on <strong><a href="https://www.linkedin.com/in/rishi-raj2oct/"> LinkedIn! </a></strong>
