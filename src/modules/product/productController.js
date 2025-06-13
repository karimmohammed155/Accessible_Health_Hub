import { asyncHandler } from "../../utils/asyncHandler.js";
import {nanoid}  from "nanoid";
import {cloudinary} from './../../utils/cloudinary.js';
import { Product } from './../../../DB/models/productModel.js';

export const createProduct=asyncHandler(async(req,res,next)=>{

    //check files
    if(!req.files) return next(new Error("product images are required",{cause:400}));

    //create folder name
    const cloudFolder=nanoid();


    //upload default image
    const {secure_url,public_id}=await cloudinary.uploader.upload(req.files.productImage[0].path,{folder:`${process.env.CLOUD_FOLDER_NAME}/products/${cloudFolder}`});

    //create product
    const product=await Product.create({...req.body,cloudFolder,productImage:{url:secure_url,id:public_id}});

    //send response
    return res.json({
        success:true,
        message:"product created successfully"
    })
});

export const deleteProduct=asyncHandler(async(req,res,next)=>{
    //check product
    const product=await Product.findById(req.params.id);
    if(!product) return next(new Error("Product not found",{cause:404}));

     // Delete image only if it exists
  if (product.productImage?.id) {
    const id=product.productImage.id;
    await cloudinary.api.delete_resources(id);
  }
    //delete folder
    await cloudinary.api.delete_folder(`${process.env.CLOUD_FOLDER_NAME}/products/${product.cloudFolder}`)
    
    //delete product from db
    await product.deleteOne();

    //return response
    return res.json({
        success:true,
        message:"product deleted successfully!"
    })

});

export const allProducts=asyncHandler(async(req,res,next)=>{
    const { sort = "", keyword = "" } = req.query;

  // Build search query
  let products;

  if (keyword) {
    // Search only
    const searchQuery = { name: { $regex: keyword, $options: "i" } };
    products = await Product.find(searchQuery);
  } else if (sort) {
    // Sort only
    products = await Product.find({}).sort(sort);
  } else {
    // No search, no sort — return all
    products = await Product.find({});
  }

  return res.json({
    success: true,
    count: products.length,
    products,
  });
});


export const updateProduct=asyncHandler(async(req,res,next)=>{
 const {name,price,description,link}=req.body;
    // Check if the product exists
    const product = await Product.findById(req.params.id);
    if (!product) {
        next(new Error("Product not found", { cause: 404 }));
        return;
    }

    const updatedProduct=await Product.findByIdAndUpdate(req.params.id,{name,price,description,link})

    return res.json({
        success: true,
        message: "Product updated successfully!",
        product: updatedProduct
    });
})
