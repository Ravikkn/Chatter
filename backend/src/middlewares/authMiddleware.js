import jwt from "jsonwebtoken";
const jwtAuth = (req, res, next) => {
  // 1. read header
  const authHeader = req.headers["authorization"];

  // 2. check if exists
  if (!authHeader) {
    return res.status(401).send("Unauthorized");
  }
  try {
    // ✅ handle both formats
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    // ✅ 4. verify token
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    //5.attach payload
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

export default jwtAuth;
