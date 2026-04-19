import ChatRepository from "../repository/chatRepository.js";
import Chat from "../models/chat.schema.js";
export default class ChatController {
  constructor() {
    this.chatRepository = new ChatRepository();
  }
  async accessChat(req, res) {
    try {
      const { userId } = req.body;
      const loggedinUserId = req.user.userId;

      if (!userId) {
        return res.status(400).json({ message: "User Required" });
      }
      const existingChat = await this.chatRepository.findChat(
        loggedinUserId,
        userId,
      );
      if (!existingChat) {
        const createdChat = await this.chatRepository.createChat(
          loggedinUserId,
          userId,
        );
        return res.status(201).json({
          message: "chat created",
          chatDetails: createdChat,
        });
      } else {
        return res.status(200).json({
          message: "chat found",
          chatDetails: existingChat,
        });
      }
    } catch (error) {
      res.status(500).json({ message: "internal server error" + error });
    }
  }
  async createGroupChat(req, res) {
    try {
      const { name, users } = req.body;

      if (!name || !users || users.length < 2) {
        return res.status(400).json({ message: "At least 2 users required" });
      }

      const groupChat = await Chat.create({
        chatName: name,
        isGroupChat: true,
        users: [...users, req.user.userId],
        groupAdmin: req.user.userId,
      });

      const fullGroup = await Chat.findById(groupChat._id).populate(
        "users",
        "name email",
      );

      res.status(201).json({
        message: "Group created",
        chatDetails: fullGroup,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getUserChats(req, res) {
    try {
      const userId = req.user.userId;

      if (!userId) {
        return res.status(400).json({ message: "User not found in request" });
      }

      const chats = await Chat.find({
        users: { $in: [userId] },
      })
        .populate("users", "name email")
        .populate("groupAdmin", "name email")
        .sort({ updatedAt: -1 });

      res.status(200).json({
        message: "Chats fetched",
        chats,
      });
    } catch (error) {
      console.log("GET CHAT ERROR:", error); // 🔥 IMPORTANT
      res.status(500).json({ message: error.message });
    }
  }

  async addToGroup(req, res) {
    try {
      const { chatId, userId } = req.body;

      const chat = await Chat.findById(chatId);

      if (!chat.isGroupChat) {
        return res.status(400).json({ message: "Not a group" });
      }

      if (chat.groupAdmin.toString() !== req.user.userId) {
        return res.status(403).json({ message: "Only admin can add" });
      }

      chat.users.push(userId);
      await chat.save();

      const updatedChat = await Chat.findById(chatId).populate("users");

      res.json(updatedChat);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async removeFromGroup(req, res) {
    try {
      const { chatId, userId } = req.body;

      const chat = await Chat.findById(chatId);

      if (chat.groupAdmin.toString() !== req.user.userId) {
        return res.status(403).json({ message: "Only admin can remove" });
      }

      chat.users = chat.users.filter((u) => u.toString() !== userId);

      await chat.save();

      const updatedChat = await Chat.findById(chatId).populate("users");

      res.json(updatedChat);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async leaveGroup(req, res) {
    try {
      const { chatId } = req.body;

      const chat = await Chat.findById(chatId);

      chat.users = chat.users.filter((u) => u.toString() !== req.user.userId);

      await chat.save();

      res.json({ message: "Left group" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
  async deleteChat(req, res) {
    try {
      const { chatId } = req.params;

      await Chat.findByIdAndDelete(chatId);

      res.json({ message: "Chat deleted" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}
