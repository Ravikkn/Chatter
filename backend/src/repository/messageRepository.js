import mongoose from "mongoose";
import Message from "../models/message.schema.js";

export default class MessageRepository {
  async createMessage(data) {
    const message = new Message(data);
    return await message.save();
  }
  async getMessage(chatId) {
    return await Message.find({ chat: chatId })
      .sort({ createdAt: 1 })
      .populate("sender", "name email");
  }
}
