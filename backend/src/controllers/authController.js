import AuthRepository from "../repository/authRepository.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
export default class AuthController {
  constructor() {
    this.authRepository = new AuthRepository();
  }

  async register(req, res) {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }
      const existingUser = await this.authRepository.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await this.authRepository.register(
        name,
        email,
        hashedPassword,
      );

      return res.status(201).json({
        message: "User registered successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }
      const user = await this.authRepository.findByEmail(email);
      const isMatch = await bcrypt.compare(password, user.password);

      if (!user || !isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      return res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getUsers(req, res) {
    try {
      const users = await this.authRepository.getAllUsers();

      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  }
}
