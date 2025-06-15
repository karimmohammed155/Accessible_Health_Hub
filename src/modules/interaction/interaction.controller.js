import { interaction, notification, post } from "../../../DB/models/index.js";
import { Error_handler_class, get_socket } from "../../utils/index.js";

// POST /api/interaction/{post_id}/like
export const like_post = async (req, res, next) => {
  const { post_id } = req.params;
  const user_id = req.user._id;
  // check if post and user ids are valid
  if (!post_id || !user_id) {
    return next(
      new Error_handler_class(
        "invalid post id or user id",
        400,
        "like_post api"
      )
    );
  }
  // check if post exists
  const post_exists = await post.findOne({ _id: post_id });
  if (!post_exists) {
    return res.status(404).json({ error: "Post not found" });
  }
  // check if like exists
  const like_exists = await interaction.findOne({
    user_id: user_id,
    post_id: post_id,
    type: "like",
  });
  // remove like from interaction and post
  if (like_exists) {
    await interaction.findByIdAndDelete(like_exists._id);
    await post.findByIdAndUpdate(post_id, {
      $pull: { interactions: like_exists._id },
    });
    // Remove the related notification
    await notification.findOneAndDelete({
      sender: user_id,
      receiver: post_exists.author._id,
      postId: post_id,
      type: "like",
    });
    get_socket().emit("notification", { message: "like removed" });
    return res.json({
      message: "Like Removed",
      Data: {
        user_id,
        post_id,
        type: "like",
        isLiked: false,
      },
    });
  }
  // add new like
  const new_like = new interaction({
    user_id: user_id,
    post_id: post_id,
    type: "like",
    isLiked: true,
  });
  await new_like.save();

  // add like to post
  await post.findByIdAndUpdate(post_id, {
    $push: { interactions: new_like._id },
  });
  //
  await notification.create({
    sender: user_id,
    receiver: post_exists.author._id,
    type: "like",
    postId: post_id,
  });
  get_socket().emit("notification", { message: "new like added" });
  // response
  res.status(201).json({ message: "Post Liked", Data: new_like });
};
// POST /api/interaction/{postId}/save
export const save_post = async (req, res, next) => {
  const { post_id } = req.params;
  const user_id = req.user._id;
  // check if post and user ids are valid
  if (!post_id || !user_id) {
    return next(
      new Error_handler_class(
        "invalid post id or user id",
        400,
        "like_post api"
      )
    );
  }
  // check if post exists
  const post_exists = await post.findOne({ _id: post_id });
  if (!post_exists) {
    return res.status(404).json({ error: "Post not found" });
  }
  // check if save exists
  const save_exists = await interaction.findOne({
    post_id: post_id,
    user_id: user_id,
    type: "save",
  });
  // remove save from post and interaction
  if (save_exists) {
    await interaction.findByIdAndDelete(save_exists._id);
    await post.findByIdAndUpdate(post_id, {
      $pull: { interactions: save_exists._id },
    });
    return res.json({
      message: "Post unsaved",
      Data: {
        user_id,
        post_id,
        type: "save",
        isSaved: false,
      },
    });
  }
  // add new save
  const new_save = new interaction({
    user_id: user_id,
    post_id: post_id,
    type: "save",
    isSaved: true,
  });
  await new_save.save();
  // add save to post
  await post.findByIdAndUpdate(post_id, {
    $push: { interactions: new_save._id },
  });
  // response
  res.status(201).json({ message: "Post saved", Data: new_save });
};
// GET /api/interaction/{postId}/likes_count
export const get_likes_count = async (req, res, next) => {
  const { post_id } = req.params;
  // check if post exists
  const post_exists = await post.findOne({ _id: post_id });
  if (!post_exists) {
    return res.status(404).json({ error: "Post not found" });
  }
  // get likes count for specific post
  const likes_count = await interaction.countDocuments({
    post_id: post_id,
    type: "like",
  });
  // response
  res.status(201).json({ post: post_id, likes_count: likes_count });
};
// GET /api/interactions/saved_posts
export const get_saved_post = async (req, res, next) => {
  // retrieve saved posts for authenticated user
  const saved_posts = await interaction
    .find({
      user_id: req.user._id,
      type: "save",
    })
    .populate("post_id");
  // Check if saved posts exist
  if (!saved_posts || saved_posts.length == 0) {
    return res
      .status(404)
      .json({ message: "No saved posts found for this user." });
  }
  // response
  res.status(200).json(saved_posts.map((i) => i.post_id));
};
