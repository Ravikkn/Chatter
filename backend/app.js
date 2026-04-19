import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import connectDB from "./src/config/connectDB.js";
import authRouter from "./src/routes/auth.route.js";
import chatRouter from "./src/routes/chat.route.js";
import messageRouter from "./src/routes/message.route.js";

dotenv.config();
const app = express();

app.use(
  cors({
    origin: "*", // later you can restrict to frontend URL
  }),
);
app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", messageRouter);

//1. Create HTTP server
const server = http.createServer(app);

//2. Initialize Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

//global io
global.io = io;

//3. Handle Socket.IO connections
let onlineUsers = [];

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // 🔹 Join chat room
  socket.on("join_chat", (chatId) => {
    socket.join(chatId);
    console.log("User joined chat:", chatId);
  });

  // 🔹 Setup user (for online tracking)
  socket.on("setup", (userId) => {
    socket.userId = userId;

    socket.join(userId);
    socket.broadcast.emit("user_joined", userId);

    if (!onlineUsers.includes(userId)) {
      onlineUsers.push(userId);
    }

    io.emit("online_users", onlineUsers);
  });

  // 🔹 Typing indicator
  socket.on("typing", (chatId) => {
    socket.to(chatId).emit("typing");
  });

  socket.on("stop_typing", (chatId) => {
    socket.to(chatId).emit("stop_typing");
  });

  // 🔹 Disconnect (single clean handler)
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    if (socket.userId) {
      onlineUsers = onlineUsers.filter((id) => id !== socket.userId);
    }
    if (socket.userId) {
      socket.broadcast.emit("user_left", socket.userId);
    }

    io.emit("online_users", onlineUsers);
  });
});

app.get("/", (req, res) => {
  res.send("API is running");
});

//4.start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
