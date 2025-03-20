import { nanoid } from "nanoid";
import { interaction, post } from "../../../DB/models/index.js";
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
      folder: `${process.env.UPLOADS_FOLDER}/posts/${custom_id}`,
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
// get all posts api
export const get_all_posts = async (req, res, next) => {
  const posts = await post
    .find()
    .populate("author", "name")
    .populate("comments")
    .populate("interactions");
  const new_api_feature = new api_features(posts, req.query)
    .pagination()
    .sort()
    .filters();
  const find_post = await new_api_feature.mongoose_query;
  if (!find_post) {
    return next(
      new Error_handler_class("posts not found", 404, "posts not found")
    );
  }
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

  res.json(postsWithStats);
};
// DELETE /api/comment/{post_id}/delete
export const delete_post = async () => {
  const { post_id } = req.params;
  // check if post exists
  const find_post = await post.findById(post_id);
  if (!find_post) {
    res.status(404).json({ message: "Post not found" });
  }
  // Only the author or admin can delete the post
  if (
    find_post.author.toString() !== req.user._id &&
    req.user.role !== "admin"
  ) {
    res.status(403).json({ message: "Unauthorized to delete this post" });
  }
  // Delete post
  await post.findByIdAndDelete(post_id);
  // Delete interactions related to post
  await interaction.deleteMany({ post_id: post_id });
  // response
  res.status(200).json({ message: "Post deleted successfully" });
};
