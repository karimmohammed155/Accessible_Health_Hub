import { nanoid } from "nanoid";
import { comment, interaction, post } from "../../../DB/models/index.js";
import {
  api_features,
  cloudinary,
  Error_handler_class,
} from "../../utils/index.js";

import transcribeAudio  from '../../utils/transcribe.js'; 
import fs from 'fs';
import {Filter} from 'bad-words';

// create new post api
export const add_post = async (req, res, next) => {
  const { title, content } = req.body;

  // Validate required fields
  if (!title || !content) {
    return next(
      new Error_handler_class(
        "title and content are required",
        400,
        "add post api"
      )
    );
  }

  // Initialize bad words filter
  const filter = new Filter();


  // Check if content or title contains inappropriate words
  const containsBadWords = filter.isProfane(title) || filter.isProfane(content);

  // upload the files to cloudinary
  const urls = [];
  const custom_id = nanoid(4);

  if (req.files && req.files.length > 0) {
    try {
      for (const file of req.files) {
        const { secure_url, public_id } = await cloudinary.uploader.upload(
          file.path,
          {
            folder: `${process.env.CLOUD_FOLDER_NAME}/posts/${custom_id}`,
            use_filename: true,
          }
        );
        urls.push({ secure_url, public_id });
      }
    } catch (error) {
      return next(
        new Error_handler_class(
          "Failed to upload files to Cloudinary.",
          500,
          "add_post API"
        )
      );
    }
  }

  // Create a new post object
  const new_post = new post({
    title,
    content,
    files: {
      urls: urls.length > 0 ? urls : undefined,
      custom_id: custom_id,
    },
    author: req.user._id,
    isFlagged: containsBadWords,
    flagReason: containsBadWords ? 'Contains inappropriate language' : undefined,
  });

  // Save the post to the database
  await new_post.save();

  // response
  res.status(201).json({
    message: "post created successfully",
    autoFlagged: containsBadWords,
    data: new_post,
  });
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
      const likes_count = await interaction.countDocuments({
        post_id: post._id,
        type: "like",
      });
      const ratings = await interaction.find({
        post_id: post._id,
        type: "rating",
      });
      const saves_count = await interaction.countDocuments({
        post_id: post._id,
        type: "save",
      });
      return {
        ...post._doc,
        likes_count,
        ratings_count: ratings.length,
        saves_count,
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
  const likes_count = await interaction.countDocuments({
    post_id: specific_post._id,
    type: "like",
  });
  const ratings = await interaction.find({
    post_id: specific_post._id,
    type: "rating",
  });
  const saves_count = await interaction.countDocuments({
    post_id: specific_post._id,
    type: "save",
  });
  // response
  res.json({
    post: specific_post,
    likes_count,
    ratings_count: ratings.length,
    saves_count,
  });
};
// DELETE /api/comment/delete/{post_id}

export const delete_post = async (req, res, next) => {
  const { post_id } = req.params;

  try {
    // 1. Fetch post
    const find_post = await post.findById(post_id);
    
    // 2. If post not found, return 404
    if (!find_post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // 3. Authorization check (user or admin can delete)
    const isAuthor = req.user && find_post.author.toString() === req.user._id.toString();
    const isAdmin = !!req.admin;

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized to delete this post" });
    }

    // 4. Delete post assets from Cloudinary
    if (find_post.files?.custom_id) {
      const post_path = `${process.env.CLOUD_FOLDER_NAME}/posts/${find_post.files.custom_id}`;
      try {
        await cloudinary.api.delete_resources_by_prefix(post_path);
        await cloudinary.api.delete_folder(post_path);
      } catch (err) {
        console.error("Error deleting post assets from Cloudinary:", err.message);
        // Continue deletion process even if cloud delete fails
      }
    }
    // 5. Remove related comments and interactions
    await comment.deleteMany({ post_id });
    await interaction.deleteMany({ post_id });

    // 6. Delete the post itself
    await post.findByIdAndDelete(post_id);

    // 7. Respond
    return res.status(200).json({ message: "Post deleted successfully" });

  } catch (error) {
    console.error("Error deleting post:", error);
    return res.status(500).json({ message: "An error occurred", error: error.message });
  }
};

export const searchByText = async (req, res) => {
  try {
    const { query } = req.query;
    const results = await post.find({ $text: { $search: query } });
    res.json({ success: true, query, results });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Text search failed', error: err.message });
  }
};

export const searchByAudio = async (req, res) => {

  try {
    console.log(" File received:", req.file);

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No audio file uploaded' });
    }

    // Transcribe audio file to text
    const transcript = await transcribeAudio(req.file.path);

    if (!transcript) {
      return res.status(500).json({ success: false, message: 'Failed to transcribe audio' });
    }

    // Perform text search with the transcript
    const results = await post.find({ $text: { $search: transcript } });

    // Delete the uploaded audio file after processing
    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.error('Error deleting audio file:', err);
      } else {
        console.log('Audio file deleted successfully');
      }
    });

    res.json({ success: true, transcript, results });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Audio search failed', error: err.message });
  }
};