import React, { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

function ChatPage() {
  const [users, setUsers] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/users", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setUsers(res.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchUsers();
  }, []);

  // fetch messages
  useEffect(() => {
    if (!selectedChat) return;

    socket.emit("join_chat", selectedChat._id);

    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/message/${selectedChat._id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        setMessages(res.data.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchMessages();
  }, [selectedChat]);

  // listen realtime
  useEffect(() => {
    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socket.off("receive_message");
  }, []);

  // create chat
  const handleUserClick = async (user) => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/chat",
        { userId: user._id },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setSelectedChat(res.data.chatDetails);
    } catch (error) {
      console.log(error);
    }
  };

  // send message
  const handleSendMessage = async () => {
    if (!newMessage || !selectedChat) return;

    try {
      const res = await axios.post(
        "http://localhost:5000/api/message",
        {
          content: newMessage,
          chatId: selectedChat._id,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setMessages((prev) => [...prev, res.data.data]);
      setNewMessage("");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <div style={{ width: "30%", borderRight: "1px solid gray" }}>
        <h2>Users</h2>
        {users.map((user) => (
          <div
            key={user._id}
            style={{ padding: "10px", cursor: "pointer" }}
            onClick={() => handleUserClick(user)}
          >
            {user.name}
          </div>
        ))}
      </div>

      {/* Chat Area */}
      <div style={{ width: "70%", padding: "10px" }}>
        <h2>Chat Area</h2>

        {messages.map((msg) => (
          <div key={msg._id}>
            <strong>{msg.sender.name}:</strong> {msg.content}
          </div>
        ))}

        <div style={{ marginTop: "20px" }}>
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type message"
          />
          <button onClick={handleSendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
