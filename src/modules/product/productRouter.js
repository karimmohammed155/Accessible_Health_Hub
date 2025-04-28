import { Router } from "express";
import * as productController from './productController.js';
import * as productSchema from './productSchema.js';
import { isAuthenticated } from "../../middleware/authenticationMiddleware.js";
import { fileUpload } from "../../utils/fileUpload.js";
import { validation } from "../../middleware/validationMiddleware.js";
const productRouter=Router();

//create product
productRouter.post('/',isAuthenticated,fileUpload().fields([
    {name:"productImage",maxCount:1},
]),validation(productSchema.createProduct),productController.createProduct);

//delete product
productRouter.delete('/:id',isAuthenticated,validation(productSchema.deleteProduct),productController.deleteProduct);

//get products
productRouter.get('/',productController.allProducts);

export  {productRouter};