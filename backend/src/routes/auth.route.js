import AuthController from "../controllers/authController.js";
import jwtAuth from "../middlewares/authMiddleware.js";
import express from "express";
const authRouter = express.Router();
const authController = new AuthController();

authRouter.post("/register", authController.register.bind(authController));
authRouter.post("/login", authController.login.bind(authController));
authRouter.get("/users", jwtAuth, authController.getUsers.bind(authController));

export default authRouter;
