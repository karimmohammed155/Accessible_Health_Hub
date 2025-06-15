import { post } from "../../../DB/models/post.model.js";
import { asyncHandler, sendEmail, cloudinary } from "./../../utils/index.js";
import { User, Token } from "./../../../DB/models/index.js";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import randomstring from "randomstring";
import { Admin } from "../../../DB/models/adminModel.js";



export const createAdmin = asyncHandler(async (req, res, next) => {
  const { email,name } = req.body;

  // Check if admin already exists
  const existingAdmin = await Admin.findOne({ email });
  if (existingAdmin) return next(new Error("Admin already exists", { cause: 409 }));

  // Generate a random password
  const generatedPassword = randomstring.generate(10);

  // Hash the password
  const hashedPassword = await bcrypt.hash(generatedPassword, parseInt(process.env.SALT_ROUND));

  // Create the admin
  const newAdmin = await Admin.create({
    name,
    email,
    password: hashedPassword,
    is_email_verified: true, // optional depending on your logic
  });

  // Send the email
  const sent = await sendEmail({
    to: email,
    subject: "Your Admin Account Credentials",
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background-color: #f9f9f9; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
  <h2 style="color: #2c3e50; text-align: center;">🎉 Welcome Aboard, Admin!</h2>
  <p style="font-size: 16px; color: #333;">
    Your admin account has been successfully created. Please use the following credentials to log in to your account:
  </p>
  <div style="background-color: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 5px; margin-top: 20px;">
    <p style="font-size: 16px;"><strong>Email:</strong> <span style="color: #2980b9;">${email}</span></p>
    <p style="font-size: 16px;"><strong>Password:</strong> <span style="color: #c0392b;">${generatedPassword}</span></p>
  </div>
  <p style="font-size: 15px; margin-top: 30px; color: #666;">
    🔒 For security reasons, we recommend changing your password after logging in.
  </p>
  <p style="font-size: 15px; color: #999; margin-top: 20px;">– The Admin Team</p>
</div>`,
  });

  if (!sent) return next(new Error("Failed to send email"));

  return res.status(201).json({
    success: true,
    message: "Admin created and credentials sent via email.",
  });
});


export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await Admin.findOne({ email });

  if (!user) return next(new Error("User not found!", { cause: 404 }));

  if (!user.is_email_verified)
    return next(new Error("You have to activate your account first!"));

  const match = bcrypt.compareSync(password, user.password);
  if (!match) return next(new Error("Invalid password!"));

  const token = jwt.sign(
    { email, id: user._id, role: user.role },
    process.env.SECRET_KEY,
    { expiresIn: "30d" }
  );
  const expirationDate = new Date();
  expirationDate.setHours(expirationDate.getHours() + 5);

  await Token.create({ token, user: user._id, expiredAt: expirationDate });

  return res.json({
    success: true,
    message: "User logged in successfully!",
    token: token,
  });
});

export const forgetPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await Admin.findOne({ email });

  if (!user) return next(new Error("User not found!", { cause: 404 }));

  if (!user.is_email_verified)
    return next(
      new Error("You have to verify your email first", { cause: 403 })
    );

  const forgetCode = randomstring.generate({
    length: 5,
    charset: "numeric",
  });

  user.forgetCode = forgetCode;
  await user.save();

  //send email
  const messageSent = await sendEmail({
    to: email,
    subject: "Forget password",
    html: `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 30px; background-color: #fefefe; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
  <h2 style="text-align: center; color: #2c3e50;">🔐 Password Reset Request</h2>
  <p style="font-size: 16px; color: #555; text-align: center;">
    Use the following verification code to reset your password. This code is valid for a limited time:
  </p>
  <div style="margin: 30px auto; background-color: #f0f4f8; padding: 20px 30px; text-align: center; border-radius: 8px; border: 1px dashed #ccc; width: fit-content;">
    <span style="font-size: 32px; color: #007bff; font-weight: bold; letter-spacing: 4px;">${forgetCode}</span>
  </div>
  <p style="text-align: center; font-size: 14px; color: #999;">
    If you didn’t request a password reset, you can safely ignore this email.
  </p>
  <p style="text-align: center; font-size: 14px; color: #ccc; margin-top: 30px;">— Support Team</p>
</div>`,
  });
  if (!messageSent) return next(new Error("Something went wrong!"));

  return res.json({
    success: true,
    message: "Forget code sent to user successfully",
    forgetCode,
  });
});

export const resetPassword = asyncHandler(async (req, res, next) => {
  const { email, password, forgetCode } = req.body;

  const user = await Admin.findOne({ email });

  if (!user) return next(new Error("User not found!", { cause: 404 }));

  if (forgetCode !== user.forgetCode)
    return next(new Error("Invalid code!", { cause: 406 }));

  user.password = await bcrypt.hash(password, parseInt(process.env.SALT_ROUND));
  await user.save();

  const tokens = await Token.find({ user: user._id });

  tokens.forEach(async (token) => {
    (token.isValid = false), await token.save();
  });

  return res.json({
    success: true,
    message: "Try to login now :)",
  });
});


export const get_flagged_posts = asyncHandler(async (req, res, next) => {
  const flaggedPosts=await post.find({isFlagged:true}).populate('author', 'name');
  return res.json({
    success:true,
    results:{
        flaggedPosts
    }
  });
});

export const deactivate_user = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;

  // 1. Find the flagged post by ID
  const flaggedPost = await post.findOne({ _id: postId, isFlagged: true });

  if (!flaggedPost) {
    return res.status(404).json({
      success: false,
      message: "Flagged post not found",
    });
  }

  // 2. Deactivate the user who authored the post
  const user = await User.findById(flaggedPost.author);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Author of the post not found",
    });
  }

  user.isActive = false;
  user.deactivatedUntil = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days
  await user.save();

const emailMessage = await sendEmail({
    to: user.email,
    subject: "Account deactivation alert",
    html: `
    <div style="font-family: Arial, sans-serif; font-size: 18px; color: #333; text-align: center; background-color: rgb(202, 124, 124); padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); max-width: 600px; margin: 20px auto;">
      <strong style="color: rgb(0, 0, 0);">
        Your account has been deactivated due to publishing content that violates our policy (e.g., inappropriate language). It will remain inactive until <u>${user.deactivatedUntil}</u>.
      </strong>
      <br><br>
    </div>
  `,
  });

    if (!emailMessage) {
    return res.status(500).json({
      success: false,
      message: "Failed to send rejection notification email.",
    });
  }
  
  res.json({
    success: true,
    message: `User who posted the flagged content has been deactivated for 15 days.`,
    deactivatedUntil: user.deactivatedUntil,
  });
});

export const getAllNationalIds = asyncHandler(async (req, res, next) => {
  const doctors = await User.find(
    { role: "doctor", nationalID: { $ne: null }, isVerified: false },
    { _id: 1, nationalID: 1, name: 1, email: 1 });


  return res.status(200).json({
    success: true,
    data: doctors,
  });
});

export const verifyDoctor = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;



  // Find the user (doctor) by userId
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found.",
    });
  }

  // Ensure the user is a doctor and has a national ID uploaded
  if (user.role !== "doctor") {
    return res.status(400).json({
      success: false,
      message: "Only doctor accounts can be verified.",
    });
  }

  if (!user.nationalID) {
    return res.status(400).json({
      success: false,
      message: "Doctor has not uploaded a national ID for verification.",
    });
  }

  // Ensure the doctor is not already verified
  if (user.isVerified) {
    return res.status(400).json({
      success: false,
      message: "Doctor is already verified.",
    });
  }

  // Update the user's verification status
  user.isVerified = true;
  await user.save();

  // Optionally, send a notification email to the doctor (you can use sendEmail here)
  const emailMessage = await sendEmail({
    to: user.email,
    subject: "Doctor Account Verified",
    html: `<p style="font-family: Arial, sans-serif; font-size: 18px; color: #333; text-align: center; background-color: #eaf7e3; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); max-width: 600px; margin: 20px auto;">
    <strong style="color: #4CAF50;">Your account has been successfully verified.</strong><br>
    You can now access all the doctor features.
  </p>`,
  });

  if (!emailMessage) {
    return res.status(500).json({
      success: false,
      message: "Failed to send verification notification email.",
    });
  }

  // Return success response
  return res.status(200).json({
    success: true,
    message: `Doctor ${user.name} has been successfully verified.`,
  });
});

export const rejectDoctor = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;



  // Find the user (doctor) by userId
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found.",
    });
  }

  // Ensure the user is a doctor and has a national ID uploaded
  if (user.role !== "doctor") {
    return res.status(400).json({
      success: false,
      message: "Only doctor accounts can be verified.",
    });
  }

  if (!user.nationalID) {
    return res.status(400).json({
      success: false,
      message: "Doctor has not uploaded a national ID for verification.",
    });
  }

  // Ensure the doctor is not already verified
  if (user.isVerified) {
    return res.status(400).json({
      success: false,
      message: "Doctor is already verified.",
    });
  }


  // Optionally, send a notification email to the doctor (you can use sendEmail here)
  const emailMessage = await sendEmail({
    to: user.email,
    subject: "Doctor Account rejected",
    html: `<p style="font-family: Arial, sans-serif; font-size: 18px; color: #333; text-align: center; background-color:rgb(202, 124, 124); padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); max-width: 600px; margin: 20px auto;">
    <strong style="color: rgb(0, 0, 0);">Your account has been rejected</strong><br>
    please enter a valid national id then try again
  </p>`,
  });

  if (!emailMessage) {
    return res.status(500).json({
      success: false,
      message: "Failed to send verification notification email.",
    });
  }

    // Delete user tokens
  await Token.deleteMany({ user: user._id });
  
  // Delete user natinal id image from Cloudinary if not default
  if (user.nationalID ) {
      await cloudinary.uploader.destroy(user.nationalID.id);
  }
  
    // Delete the user
  await User.findOneAndDelete({ email: user.email });
  

  // Return success response
  return res.status(200).json({
    success: true,
    message: `Doctor  has been rejected and deleted from DB.`,
  });
});
