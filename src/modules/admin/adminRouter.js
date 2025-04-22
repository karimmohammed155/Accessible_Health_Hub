import {Router} from 'express';
import * as adminController from './adminController.js';
import * as userSchema from '../user/userSchema.js';
import { isAuthenticated } from '../../middleware/authenticationMiddleware.js';
import { fileUpload } from '../../utils/fileUpload.js';
import { validation } from '../../middleware/validationMiddleware.js';
import {delete_post} from '../post/post.controller.js';
const adminRouter=Router();


adminRouter.post(
  "/register",
  fileUpload().fields([{ name: "profileImage", maxCount: 1 }]),
  validation(userSchema.register),
  adminController.register
);
 
adminRouter.get(
  "/activate_account/:token",
  validation(userSchema.activate_account),
  adminController.activate_account
);

adminRouter.post("/login", validation(userSchema.login), adminController.login);

adminRouter.post(
  "/forgetPassword",
  validation(userSchema.forgetPassword),
  adminController.forgetPassword
);

adminRouter.put(
  "/resetPassword",
  validation(userSchema.resetPassword),
  adminController.resetPassword
);

adminRouter.delete('/remove-post/:post_id',isAuthenticated,delete_post);
adminRouter.get('/flaggedPosts',isAuthenticated,adminController.get_flagged_posts);
adminRouter.put('/deactivate_user/:postId',isAuthenticated,adminController.deactivate_user);
adminRouter.get('/AllNationalIds',isAuthenticated,adminController.getAllNationalIds);
adminRouter.put('/verifyDoctor/:userId',isAuthenticated,adminController.verifyDoctor);

export  {adminRouter};