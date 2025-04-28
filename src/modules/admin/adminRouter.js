import {Router} from 'express';
import * as adminController from './adminController.js';
import * as userSchema from '../user/userSchema.js';
import { isAuthenticated } from '../../middleware/authenticationMiddleware.js';
import { fileUpload } from '../../utils/fileUpload.js';
import { validation } from '../../middleware/validationMiddleware.js';
import {delete_post} from '../post/post.controller.js';
import * as productController from '../product/productController.js';
import * as productSchema from '../product/productSchema.js';
const adminRouter=Router();


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
//create product
adminRouter.post('/',isAuthenticated,fileUpload().fields([
    {name:"productImage",maxCount:1},
]),validation(productSchema.createProduct),productController.createProduct);

//delete product
adminRouter.delete('/:id',isAuthenticated,validation(productSchema.deleteProduct),productController.deleteProduct);

export  {adminRouter};