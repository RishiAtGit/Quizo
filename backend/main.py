# backend/main.py
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import random
import string
import time
from typing import Optional

# --- Pydantic Models for Data Validation ---
class Question(BaseModel):
    text: str
    options: list[str]
    correct_option: int

class QuizData(BaseModel):
    title: str
    questions: list[Question]

# --- FastAPI App Initialization ---
app = FastAPI()

origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_code: str):
        await websocket.accept()
        if room_code not in self.active_connections:
            self.active_connections[room_code] = []
        self.active_connections[room_code].append(websocket)

    def disconnect(self, websocket: WebSocket, room_code: str):
        if room_code in self.active_connections and websocket in self.active_connections[room_code]:
            self.active_connections[room_code].remove(websocket)

    async def broadcast(self, message: dict, room_code: str):
        if room_code in self.active_connections:
            message_json = json.dumps(message)
            for connection in self.active_connections[room_code]:
                await connection.send_text(message_json)

manager = ConnectionManager()
quizzes: dict = {}

def generate_room_code():
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        if code not in quizzes: return code

@app.post("/api/create_quiz")
async def create_quiz(quiz_data: QuizData):
    room_code = generate_room_code()
    
    quizzes[room_code] = {
        "quiz_data": quiz_data.dict(),
        "players": [], "host": None, "state": "lobby",
        "current_question_index": -1, "answers": {}, "scores": {}, "room_code": room_code,
        "question_start_time": 0
    }
    return {"room_code": room_code}

@app.websocket("/ws/{room_code}/{nickname}")
async def websocket_endpoint(websocket: WebSocket, room_code: str, nickname: str, avatar: Optional[str] = '👤'):
    if room_code not in quizzes:
        await websocket.close(code=4000, reason="Room not found"); return

    await manager.connect(websocket, room_code)
    room = quizzes[room_code]

    is_host = not room["host"]
    if is_host: room["host"] = nickname
    
    room["players"].append({"nickname": nickname, "avatar": avatar})
    if not is_host: room["scores"][nickname] = 0

    try:
        await manager.broadcast(room, room_code)

        while True:
            data = await websocket.receive_json()
            action = data.get("action")

            if is_host and action in ["start_quiz", "next_question"]:
                next_q_index = 0 if action == "start_quiz" else room["current_question_index"] + 1
                if next_q_index < len(room["quiz_data"]["questions"]):
                    room["state"] = "question"
                    room["current_question_index"] = next_q_index
                    room["answers"] = {}
                    room["question_start_time"] = time.time()
                else:
                    room["state"] = "finished"
                await manager.broadcast(room, room_code)

            elif action == "submit_answer" and not is_host:
                time_taken = time.time() - room["question_start_time"]
                current_q = room["quiz_data"]["questions"][room["current_question_index"]]
                correct_answer_index = current_q["correct_option"]
                
                is_correct = data.get("answer_index") == correct_answer_index
                room["answers"][nickname] = {
                    "answer": data.get("answer_index"),
                    "is_correct": is_correct,
                    "time_taken": time_taken
                }
                
                player_count = len(room["players"]) - 1
                if len(room["answers"]) == player_count:
                    room["state"] = "results"
                    await manager.broadcast(room, room_code)
                else:
                    await manager.broadcast(room, room_code)

    except WebSocketDisconnect:
        manager.disconnect(websocket, room_code)
        room["players"] = [p for p in room["players"] if p["nickname"] != nickname]
        if nickname in room["scores"]: del room["scores"][nickname]
        if is_host and not any(p['nickname'] == nickname for p in room['players']):
             room["host"] = room["players"][0]["nickname"] if room["players"] else None
        await manager.broadcast(room, room_code)