import mongoose from "mongoose";
import Chat from "../models/chat.schema.js";

export default class ChatRepository {
  async findChat(loggedinUserId, userId) {
    return await Chat.findOne({
      isGroupChat: false,
      users: { $all: [loggedinUserId, userId] },
    });
  }

  async createChat(loggedinUserId, userId) {
    const newChat = new Chat({
      chatName: "sender",
      isGroupChat: false,
      users: [loggedinUserId, userId],
    });
    return await newChat.save();
  }

  async getUserChats(userId) {
    return await Chat.find({
      users: { $elemMatch: { $eq: userId } },
    })
      .populate("users", "name email") // 🔥 IMPORTANT
      .populate("groupAdmin", "name") // (for groups)
      .sort({ updatedAt: -1 });
  }
}
