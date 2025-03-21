import { nanoid } from "nanoid";
import { comment, interaction, post } from "../../../DB/models/index.js";
import {
  api_features,
  cloudinary,
  Error_handler_class,
} from "../../utils/index.js";

// create new post api
export const add_post = async (req, res, next) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return next(
      new Error_handler_class(
        "title and content are required",
        400,
        "add post api"
      )
    );
  }
  // image
  if (!req.file) {
    return next(
      new Error_handler_class(
        "please upload an image",
        400,
        "please upload an image"
      )
    );
  }
  // upload the image to cloudinary
  const custom_id = nanoid(4);
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: `${process.env.CLOUD_FOLDER_NAME}/posts/${custom_id}`,
    }
  );
  const new_post = new post({
    title,
    content,
    image: {
      secure_url: secure_url,
      public_id: public_id,
    },
    custom_id: custom_id,
    author: req.user._id,
  });
  await new_post.save();
  res
    .status(201)
    .json({ message: "post created successfully", data: new_post });
};
// Get all posts api
export const get_all_posts = async (req, res, next) => {
  // Get posts with their all details
  const posts = post
    .find()
    .populate("author", "name")
    .populate({
      path: "comments",
      match: { parent_comment: null },
      populate: {
        path: "replies",
        populate: { path: "author", select: "name" },
      },
    })
    .populate("interactions");
  // Apply api features to the retrieved posts
  const new_api_feature = new api_features(posts, req.query)
    .sort()
    .pagination()
    .filters();
  // Check if the posts exists
  const find_post = await new_api_feature.mongoose_query;
  if (!find_post) {
    return next(
      new Error_handler_class("posts not found", 404, "posts not found")
    );
  }
  // Get posts with their stats
  const postsWithStats = await Promise.all(
    find_post.map(async (post) => {
      const likesCount = await interaction.countDocuments({
        post_id: post._id,
        type: "like",
      });
      const ratings = await interaction.find({
        post_id: post._id,
        type: "rating",
      });
      return {
        ...post._doc,
        likesCount,
        ratingsCount: ratings.length,
      };
    })
  );
  // response
  res.json({ posts: postsWithStats });
};
// Get specific posts api
export const get_specific_post = async (req, res, next) => {
  const { _id } = req.params;
  // Get post with it's all details
  const specific_post = await post
    .findById(_id)
    .populate("author", "name")
    .populate({
      path: "comments",
      match: { parent_comment: null },
      populate: {
        path: "replies",
        populate: { path: "author", select: "name" },
      },
    })
    .populate("interactions");
  // Check if the posts exists
  if (!specific_post) {
    return next(
      new Error_handler_class("posts not found", 404, "posts not found")
    );
  }
  // Get post with it's stats
  const likesCount = await interaction.countDocuments({
    post_id: specific_post._id,
    type: "like",
  });
  const ratings = await interaction.find({
    post_id: specific_post._id,
    type: "rating",
  });
  // response
  res.json({ post: specific_post, likesCount, ratingsCount: ratings.length });
};
// DELETE /api/comment/delete/{post_id}
export const delete_post = async (req, res, next) => {
  const { post_id } = req.params;
  // check if post exists
  const find_post = await post.findById(post_id);
  if (!find_post) {
    res.status(404).json({ message: "Post not found" });
  }
  // Only the author or admin can delete the post
  if (
    find_post.author.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    return res
      .status(403)
      .json({ message: "Unauthorized to delete this post" });
  }
  // delete the related image from cloudinary
  const post_path = `${process.env.CLOUD_FOLDER_NAME}/posts/${find_post.custom_id}`;
  // delete the folder from cloudinary
  await cloudinary.api.delete_resources_by_prefix(post_path);
  await cloudinary.api.delete_folder(post_path);
  // Delete interactions and comments related to post
  await comment.deleteMany({ post_id: post_id });
  await interaction.deleteMany({ post_id: post_id });
  // Delete post
  await post.findByIdAndDelete(post_id);
  // response
  res.status(200).json({ message: "Post deleted successfully" });
};
