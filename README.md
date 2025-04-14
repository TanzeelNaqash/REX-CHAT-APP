# REX
 

A modern, full-featured **chat application** built with **React**, **Zustand**, **Node.js**, and **Socket.IO**, supporting **1-to-1 messaging**, **group chats**, **file sharing**, **custom backgrounds**, and more.

---

## 🚀 Features

- 💬 **1-to-1 Direct Messaging** – Real-time private chats using WebSockets
- 👥 **Group Chat Support** – Chat with multiple users in custom group rooms
- 🔐 **Authentication** – Secure login & registration flow
- 🎨 **Custom Chat Backgrounds** – Personalize your chat window
- 😄 **Emoji Picker** – Express yourself with a wide range of emojis
- 📎 **File Uploads** – Share images, videos, and files easily
- 📱 **Fully Responsive** – Works seamlessly on mobile, tablet, and desktop

---

## 🛠 Tech Stack

### Frontend
- ⚛️ **React**
- 🧠 **Zustand** – Lightweight state management
- 🌐 **Socket.IO Client**
- 🎨 **CSS** (Custom / Framework of choice)

### Backend
- 🟢 **Node.js + Express**
- 🌐 **Socket.IO Server**
- 🗂 **MongoDB** (Mongoose ODM)
- 📤 **Multer** for file uploads
- 🔐 **JWT / Token-based Authentication**

---

## 📸 Screenshots

![Screenshot 2025-03-10 144558](https://github.com/user-attachments/assets/44b9105c-dbd4-41a6-b212-338dcd1d7097)
![Screenshot 2025-03-10 144455](https://github.com/user-attachments/assets/901a1c58-71d9-478c-aa62-93b6cb949c49)
![Screenshot 2025-03-10 144420](https://github.com/user-attachments/assets/a22b14d5-1fa9-4abd-b6aa-8a13e9dda34c)
![Screenshot 2025-03-10 144320](https://github.com/user-attachments/assets/11312f93-4060-4c2f-a620-348c9e22afbb)
![Screenshot 2025-03-10 144233](https://github.com/user-attachments/assets/7c5698ec-28b0-4306-9426-6c975e612c5c)
![Screenshot 2025-03-10 144141](https://github.com/user-attachments/assets/f3fd28da-6529-4309-8a9a-b5931ca3a68c)
![Screenshot 2025-03-10 143326](https://github.com/user-attachments/assets/7aac0ab6-f43d-465a-99f8-24be7d68599d)
![Screenshot 2025-03-10 143300](https://github.com/user-attachments/assets/3af6265b-bebc-43ca-931c-1e74d994ec07)
![Screenshot 2025-03-10 143215](https://github.com/user-attachments/assets/bee3a145-95d2-4b15-b3c6-753c30a431c6)
![Screenshot 2025-03-10 143136](https://github.com/user-attachments/assets/d9b915c8-8b02-4aa5-9a82-1a098e5133f6)
![Screenshot 2025-03-10 143048](https://github.com/user-attachments/assets/0f699be3-1862-4bfd-8273-4f4c3c058229)
![Screenshot 2025-03-10 143017](https://github.com/user-attachments/assets/df5dfe71-181d-4e8e-a726-cf2f1c6fe744)


---

## 📦 Installation

### 🔧 Backend Setup

```bash
cd server
npm install
npm run dev
 
```
### Configure .env for DB URI and JWT secret:
MONGO_URI=your_mongo_connection
JWT_SECRET=your_jwt_secret
 
 ---
### 🔧 Frontend Setup 
```bash
cd client
npm install
npm start
```
### 📁 Folder Structure

```bash
rex/
├── client/           # React frontend
└── server/           # Express backend & Socket.IO
