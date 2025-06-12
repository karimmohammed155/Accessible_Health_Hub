import { category, sub_category } from "../../../DB/models/index.js";
import { Error_handler_class } from "../../utils/index.js";

/**
 * @api {POST} /sub_category/create  create a new sub_category
 */
export const add_sub_category = async (req, res, next) => {
  // destructuring the request body
  const { name, category_id } = req.body;
  // find the category by id
  const Category = await category.findById(category_id);
  if (!Category) {
    return next(
      new Error_handler_class("category not found", 400, "category not found")
    );
  }
  // prepare sub_category object
  const sub_category_object = {
    name,
    category: Category._id,
  };
  // create the sub_category in db
  const new_sub_category = await sub_category.create(sub_category_object);
  // response
  res.status(201).json({
    message: "sub_category created successfully",
    data: new_sub_category,
  });
};
/**
 * @api {get} /sub_category/get_all  get sub_category
 */
export const find_sub_category = async (req, res, next) => {
  const { _id, name } = req.query;
  const query_filter = {};
  // check if the query params are present
  if (_id) query_filter._id = _id;
  if (name) query_filter.name = name;
  //find the sub_category
  const get_sub_category = await sub_category.find(query_filter);
  if (!get_sub_category) {
    return next(
      new Error_handler_class(
        "sub_category not found",
        404,
        "sub_category not found"
      )
    );
  }
  // response
  res.status(200).json({
    message: "sub_category found",
    data: get_sub_category,
  });
};
/**
 * @api {put} sub_category/update/:_id update sub_category
 */
export const update_sub_category = async (req, res, next) => {
  // get the sub_category id
  const { _id } = req.params;
  // find the sub_category by id
  const Sub_category = await sub_category.findById(_id);
  if (!Sub_category) {
    return next(
      new Error_handler_class(
        "sub_category not found",
        404,
        "sub_category not found"
      )
    );
  }
  // update sub_category name
  const { name } = req.body;
  if (name) {
    Sub_category.name = name;
  }
  // save sub_category changes
  await Sub_category.save();
  // response
  res
    .status(200)
    .json({ message: "sub_category updated successfully", data: Sub_category });
};
/**
 * @api {delete} sub_category/delete/:_id delete sub_category
 */
export const delete_sub_category = async (req, res, next) => {
  // get the sub-category id
  const { _id } = req.params;
  // find the sub-category by id and delete it
  const Sub_category = await sub_category.findByIdAndDelete(_id);
  if (!Sub_category) {
    return next(
      new Error_handler_class(
        "sub_category not found",
        400,
        "sub_category not found"
      )
    );
  }
  // response
  res.status(200).json({ message: "sub_category deleted successfully" });
};
