import { Router } from "express";
import * as userController from "./userController.js";
import * as userSchema from "./userSchema.js";
import { fileUpload } from "../../utils/index.js";
import { isAuthenticated, validation } from "./../../middleware/index.js";
const user_router = Router();

user_router.post(
  "/register",
  fileUpload().fields([{ name: "profileImage", maxCount: 1 },{ name: "nationalID", maxCount: 1 } ]),
  validation(userSchema.register),
  userController.register
);

user_router.get(
  "/activate_account/:token",
  validation(userSchema.activate_account),
  userController.activate_account
);

user_router.post("/login", validation(userSchema.login), userController.login);

user_router.post(
  "/forgetPassword",
  validation(userSchema.forgetPassword),
  userController.forgetPassword
);

user_router.put(
  "/resetPassword",
  validation(userSchema.resetPassword),
  userController.resetPassword
);

user_router.delete("/deleteUser", isAuthenticated, userController.deleteUser);

user_router.put(
  "/updateUser",
  isAuthenticated,
  fileUpload().fields([{ name: "profileImage", maxCount: 1 }]),
  validation(userSchema.updateUser),
  userController.updateUser
);

user_router.get('/userProfile',isAuthenticated,userController.userProfile);
export { user_router };
