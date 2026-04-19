import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import "./chat.css";
import { BASE_URL } from "../../config.js";

const socket = io(`${BASE_URL}`);

function ChatPage() {
  const [darkMode, setDarkMode] = useState(false);
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const user = {
    _id: userData._id || userData.id, // 🔥 important fallback
    name: userData.name,
  };

  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [canPlaySound, setCanPlaySound] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showMenu, setShowMenu] = useState(false);

  const bottomRef = useRef(null);

  // 🔹 Fetch Chats
  const fetchChats = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/chat`, {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      });
      setChats(res.data.chats || []);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/auth/users`, {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      });
      setAllUsers(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  useEffect(() => {
    fetchChats();
  }, []);

  // 🔹 Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔹 Join chat + load messages
  useEffect(() => {
    if (!selectedChat) return;

    socket.emit("join_chat", selectedChat._id);

    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `${BASE_URL}/api/message/` + selectedChat._id,
          {
            headers: {
              Authorization: "Bearer " + localStorage.getItem("token"),
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

  // 🔹 Enable sound after click
  useEffect(() => {
    const enableSound = () => setCanPlaySound(true);
    window.addEventListener("click", enableSound);
    return () => window.removeEventListener("click", enableSound);
  }, []);

  // 🔹 Notifications
  useEffect(() => {
    socket.on("user_joined", () => {
      setNotifications((prev) => [...prev, "🟢 A user joined"]);
    });

    socket.on("user_left", () => {
      setNotifications((prev) => [...prev, "🔴 A user left"]);
    });

    return () => {
      socket.off("user_joined");
      socket.off("user_left");
    };
  }, []);

  // 🔹 Receive messages
  useEffect(() => {
    const handler = (msg) => {
      setMessages((prev) => {
        if (prev.find((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });

      if (canPlaySound) {
        const audio = new Audio("/notification.mp3");
        audio.play().catch(() => {});
      }
    };

    socket.on("receive_message", handler);
    return () => socket.off("receive_message", handler);
  }, [canPlaySound]);

  // 🔹 Online users
  useEffect(() => {
    if (!user?._id) return;

    socket.emit("setup", user._id);

    const handler = (users) => {
      setOnlineUsers(users);
      setOnlineCount(users.length);
    };

    socket.on("online_users", handler);
    return () => socket.off("online_users", handler);
  }, []);

  // 🔹 Typing
  useEffect(() => {
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop_typing", () => setIsTyping(false));

    return () => {
      socket.off("typing");
      socket.off("stop_typing");
    };
  }, []);

  // 🔹 Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      await axios.post(
        `${BASE_URL}/api/message`,
        {
          content: newMessage,
          chatId: selectedChat._id,
        },
        {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        },
      );
      setNewMessage("");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className={`container ${darkMode ? "dark" : ""}`}>
      {/* Sidebar */}
      <div className="sidebar">
        <button className="group-btn" onClick={() => setShowGroupModal(true)}>
          + New Group
        </button>
        {chats.map((chat) => {
          const otherUser = chat.users?.find(
            (u) => u?._id?.toString() !== user?._id?.toString(),
          );

          return (
            <div
              key={chat._id}
              className={`user ${
                selectedChat?._id === chat._id ? "active" : ""
              }`}
              onClick={() => setSelectedChat(chat)}
            >
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  chat.isGroupChat ? chat.chatName : otherUser?.name || "User",
                )}`}
                alt="avatar"
                className="avatar"
              />

              <div>
                <div>
                  {chat.isGroupChat ? chat.chatName : otherUser?.name || "User"}
                </div>

                <div className="status">
                  {chat.isGroupChat
                    ? "Group"
                    : onlineUsers.includes(otherUser?._id?.toString())
                      ? "🟢 online"
                      : "⚫ offline"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Chat */}
      <div className="chat">
        <div className="header">
          {/* LEFT: Chat Info */}
          <div className="header-left">
            <div className="header-name">
              {selectedChat?.isGroupChat
                ? selectedChat.chatName
                : selectedChat?.users?.find(
                    (u) => u?._id?.toString() !== user?._id?.toString(),
                  )?.name}
            </div>

            <div className="header-status">👥 {onlineCount} online</div>
          </div>

          {/* RIGHT: Actions */}
          <div className="header-right">
            {/* Dark mode */}
            <button className="icon-btn" onClick={() => setDarkMode(!darkMode)}>
              🌙
            </button>

            {/* 3-dot menu */}
            <div className="menu-container">
              <button
                className="icon-btn"
                onClick={() => setShowMenu(!showMenu)}
              >
                ⋮
              </button>

              {showMenu && (
                <div className="menu-dropdown">
                  {/* Delete / Leave */}
                  <div
                    className="menu-item"
                    onClick={async () => {
                      setShowMenu(false);

                      if (!selectedChat) return;

                      const confirmDelete = window.confirm(
                        selectedChat.isGroupChat
                          ? "Leave/Delete group?"
                          : "Delete chat?",
                      );
                      if (!confirmDelete) return;

                      try {
                        if (selectedChat.isGroupChat) {
                          const isAdmin =
                            selectedChat.groupAdmin?._id?.toString() ===
                            user._id?.toString();

                          if (isAdmin) {
                            await axios.delete(
                              `${BASE_URL}/api/chat/${selectedChat._id}`,
                              {
                                headers: {
                                  Authorization:
                                    "Bearer " + localStorage.getItem("token"),
                                },
                              },
                            );
                          } else {
                            await axios.put(
                              `${BASE_URL}/api/chat/group/leave`,
                              { chatId: selectedChat._id },
                              {
                                headers: {
                                  Authorization:
                                    "Bearer " + localStorage.getItem("token"),
                                },
                              },
                            );
                          }
                        } else {
                          await axios.delete(
                            `${BASE_URL}/api/chat/${selectedChat._id}`,
                            {
                              headers: {
                                Authorization:
                                  "Bearer " + localStorage.getItem("token"),
                              },
                            },
                          );
                        }

                        setSelectedChat(null);
                        fetchChats();
                      } catch (err) {
                        console.log(err);
                        alert("Error");
                      }
                    }}
                  >
                    {selectedChat?.isGroupChat
                      ? "Leave / Delete Group"
                      : "Delete Chat"}
                  </div>

                  {/* Logout */}
                  <div
                    className="menu-item"
                    onClick={() => {
                      localStorage.clear();
                      window.location.reload();
                    }}
                  >
                    Logout
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {notifications.map((note, i) => (
          <div key={i} style={{ fontSize: "12px", color: "gray" }}>
            {note}
          </div>
        ))}

        <div className="messages">
          {messages.map((msg) => {
            const isMe = msg.sender?._id?.toString() === user?._id?.toString();

            return (
              <div key={msg._id} className={`message ${isMe ? "me" : ""}`}>
                <div className="bubble">
                  {!isMe && <div>{msg.sender?.name}</div>}
                  <div>{msg.content}</div>
                  <div style={{ fontSize: "10px" }}>
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef}></div>
        </div>

        {isTyping && <p style={{ padding: "10px" }}>Typing...</p>}

        <div className="inputBox">
          <input
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);

              if (selectedChat) {
                socket.emit("typing", selectedChat._id);
                setTimeout(() => {
                  socket.emit("stop_typing", selectedChat._id);
                }, 1000);
              }
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type message..."
          />
          <button onClick={handleSendMessage}>➤</button>
        </div>
      </div>

      {/* Group model */}

      {showGroupModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Create Group</h3>

            <input
              type="text"
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />

            <div className="user-list">
              {allUsers.map((u) => (
                <label key={u._id} className="user-item">
                  <input
                    type="checkbox"
                    value={u._id}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers((prev) => [...prev, u._id]);
                      } else {
                        setSelectedUsers((prev) =>
                          prev.filter((id) => id !== u._id),
                        );
                      }
                    }}
                  />
                  {u.name}
                </label>
              ))}
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowGroupModal(false)}>Cancel</button>

              <button
                onClick={async () => {
                  if (!groupName || selectedUsers.length < 2) {
                    return alert("Add name & at least 2 users");
                  }

                  try {
                    await axios.post(
                      `${BASE_URL}/api/chat/group`,
                      {
                        name: groupName,
                        users: selectedUsers,
                      },
                      {
                        headers: {
                          Authorization:
                            "Bearer " + localStorage.getItem("token"),
                        },
                      },
                    );

                    alert("Group created ✅");
                    setShowGroupModal(false);
                    setGroupName("");
                    setSelectedUsers([]);
                    fetchChats();
                  } catch (err) {
                    console.log(err);
                    alert("Error creating group");
                  }
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatPage;
