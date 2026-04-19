import User from "../models/user.schema.js";
export default class AuthRepository {
  async findByEmail(email) {
    return await User.findOne({ email });
  }
  async register(name, email, password) {
    const user = new User({ name, email, password });
    return await user.save();
  }

  async getAllUsers() {
    return await User.find().select("-password");
  }
}
