import ChatController from "../controllers/chatController.js";
import jwtAuth from "../middlewares/authMiddleware.js";
import express from "express";

const chatRouter = express.Router();
const chatController = new ChatController();

chatRouter.post("/", jwtAuth, chatController.accessChat.bind(chatController));
chatRouter.post(
  "/group",
  jwtAuth,
  chatController.createGroupChat.bind(chatController),
);
chatRouter.get("/", jwtAuth, chatController.getUserChats.bind(chatController));

chatRouter.put(
  "/group/add",
  jwtAuth,
  chatController.addToGroup.bind(chatController),
);
chatRouter.put(
  "/group/remove",
  jwtAuth,
  chatController.removeFromGroup.bind(chatController),
);
chatRouter.put(
  "/group/leave",
  jwtAuth,
  chatController.leaveGroup.bind(chatController),
);
chatRouter.delete(
  "/:chatId",
  jwtAuth,
  chatController.deleteChat.bind(chatController),
);

export default chatRouter;
