# 🚀 CodeSync – Real-Time Code Collaboration Platform

CodeSync is a full-stack real-time code collaboration web application that allows multiple users to join a room, write code together, chat, and track code history — similar to tools like collaborative editors.

---

## 🌟 Features

### 🔐 Authentication
- User Signup & Login
- Secure authentication (JWT)
- Protected routes

### 🏠 Landing Page
- Create Room (unique ID generation)
- Join Room using ID
- Display active users

### 💻 Real-Time Code Editor
- Live code collaboration (WebSockets / Socket.io)
- Multi-user editing
- Syntax highlighting (Monaco Editor)
- Room locking/unlocking

### 💬 Chat System
- Real-time messaging between users
- User presence indicator

### 📊 Dashboard
- View created/joined rooms
- Manage sessions
- Track activity

### 📜 Code History
- Save code snapshots
- View previous versions
- Restore old code

### ⚡ Additional Features
- Terminal output panel
- User avatars & presence
- Responsive UI
- Professional developer theme (VS Code inspired)

---

## 🛠️ Tech Stack

### Frontend
- React.js (JSX)
- Tailwind CSS
- Monaco Editor

### Backend
- Node.js
- Express.js

### Database
- MongoDB

### Real-Time
- Socket.io

---

## ⚙️ Architecture

- Client (React) ↔ Server (Express)
- WebSocket connection for real-time sync
- REST APIs for authentication & data
- MongoDB for persistence

---

## 🚀 Getting Started

### 1. Clone repo
