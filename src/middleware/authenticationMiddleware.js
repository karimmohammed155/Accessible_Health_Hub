import { asyncHandler } from "../utils/index.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Token, User } from "../../DB/models/index.js";
import { Admin } from "../../DB/models/adminModel.js";
dotenv.config();
export const isAuthenticated = asyncHandler(async (req, res, next) => {
  //check token existence
  let token = req.headers["token"];
  //check bearer key
  if (!token || !token.startsWith(process.env.BEARER_KEY))
    return next(new Error("valid token is required!"));
  //extract payload
  token = token.split(process.env.BEARER_KEY)[1];
  const payload = jwt.verify(token, process.env.SECRET_KEY);
  ///check token in DB
  const tokenDB = await Token.findOne({ token, isValid: true });
  if (!tokenDB) return next(new Error("Token invalid!"));

  //check user existence
  const user = await User.findById(payload.id);
  const admin=await Admin.findById(payload.id);

  if (!user && !admin) {
    return next(new Error("User or Admin not found!", { cause: 404 }));
  } 
  
  if (user?.deactivatedUntil && !user.isActive) {
    const now = new Date();
    if (now >= user.deactivatedUntil) {
      user.isActive = true;
      user.deactivatedUntil = null;
      await user.save();
    } else {
      return res.status(403).json({
        message: `Account is deactivated until ${user.deactivatedUntil.toLocaleDateString()}`,
      });
    }
  }

  // Prevent access if doctor is not verified
  if (user?.role === "doctor" && !user.isVerified) {
    return res.status(403).json({
      message: "Your account is awaiting admin verification.",
    });
  }

  //pass user
  req.user = user;
  req.admin=admin;

  //next()
  return next();
});

//Doctor still needs to be done