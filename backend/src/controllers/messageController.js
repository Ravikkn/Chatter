import MessageRepository from "../repository/messageRepository.js";
import Message from "../models/message.schema.js";

export default class MessageController {
  constructor() {
    this.messageRepository = new MessageRepository();
  }
  async createMessage(req, res) {
    try {
      const { chatId, content } = req.body;
      const senderId = req.user.userId;
      if (!content || !chatId) {
        return res
          .status(400)
          .json({ message: "content and chatId is missing" });
      }
      const message = await this.messageRepository.createMessage({
        sender: senderId,
        content,
        chat: chatId,
      });
      const populatedMessage = await Message.findById(message._id).populate(
        "sender",
        "name email",
      );
      console.log("POPULATED:", populatedMessage);

      global.io.to(chatId).emit("receive_message", populatedMessage);
      return res.status(201).json({
        message: "message created",
        data: populatedMessage,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" + error });
    }
  }
  async getMessage(req, res) {
    try {
      const { chatId } = req.params;

      if (!chatId) {
        return res.status(400).json({ message: "missing required field" });
      }

      const messages = await this.messageRepository.getMessage(chatId);

      return res.status(200).json({
        message: "messages found",
        data: messages,
      });
    } catch (error) {
      return res.status(500).json({
        message: "internal server error",
      });
    }
  }
}
