import MessageController from "../controllers/messageController.js";
import jwtAuth from "../middlewares/authMiddleware.js";
import express from "express";

const messageRouter = express.Router();
const messageController = new MessageController();

messageRouter.post(
  "/",
  jwtAuth,
  messageController.createMessage.bind(messageController),
);
messageRouter.get(
  "/:chatId",
  jwtAuth,
  messageController.getMessage.bind(messageController),
);
export default messageRouter;
