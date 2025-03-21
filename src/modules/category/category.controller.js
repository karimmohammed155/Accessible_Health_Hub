import { category, sub_category } from "../../../DB/models/index.js";
import { Error_handler_class } from "../../utils/index.js";
/**
 * @api {POST} /categories/create  create a  new category
 */
export const add_category = async (req, res, next) => {
  // destructuring data from body
  const { name } = req.body;
  // check category exists
  const category_exists = await category.findOne({ name });
  if (category_exists) {
    return next(
      new Error_handler_class(
        "category is already exists",
        400,
        "category is already exists"
      )
    );
  }
  // create the category in db
  const new_category = await category.create({ name: name });
  // response
  res
    .status(201)
    .json({ message: "Category created successfully", data: new_category });
};
/**
 * @api {get} /category/get_all  get category
 */
export const find_category = async (req, res, next) => {
  const { _id, name } = req.query;
  const query_filter = {};
  // check if the query params are present
  if (_id) query_filter._id = _id;
  if (name) query_filter.name = name;

  //find the category
  const get_category = await category.find(query_filter);

  if (!get_category) {
    return next(
      new Error_handler_class("Category not found", 404, "Category not found")
    );
  }
  // response
  res.status(200).json({ message: "Category found", data: get_category });
};
/**
 * @api {put} /category/update/:_id update category
 */
export const update_category = async (req, res, next) => {
  // get the category id
  const { _id } = req.params;
  // find the category by id
  const Category = await category.findById(_id);
  if (!Category) {
    return next(
      new Error_handler_class("Category not found", 404, "Category not found")
    );
  }
  // update category name
  const { name } = req.body;
  if (name) {
    Category.name = name;
  }
  // save category changes
  await Category.save();
  // response
  res
    .status(200)
    .json({ message: "Category updated successfully", data: Category });
};
/**
 * @api {DELETE} /categories/delete/:_id  Delete a category
 */
export const delete_category = async (req, res, next) => {
  // get the category id
  const { _id } = req.params;
  // find the category by id and delete it
  const Category = await category.findByIdAndDelete(_id);
  if (!Category) {
    return next(
      new Error_handler_class("Category not found", 404, "Category not found")
    );
  }
  // delete relevant sub_categories
  await sub_category.deleteMany({ category: Category._id });
  // response
  res.status(200).json({ message: "Category deleted successfully" });
};
