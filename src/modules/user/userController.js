import { asyncHandler, sendEmail, cloudinary } from "./../../utils/index.js";
import { User, Token } from "./../../../DB/models/index.js";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import randomstring from "randomstring";


export const register = asyncHandler(async (req, res, next) => {
  const { email, password, role } = req.body;

  const user = await User.findOne({ email });
  if (user) return next(new Error("User already registered", { cause: 412 }));

  const hashedPassword = await bcrypt.hash(
    password,
    parseInt(process.env.SALT_ROUND)
  );

  const cloudFolder = nanoid();

  let profileImage;

  // Upload profile image or use default
  if (req.files && req.files.profileImage) {
    const file = req.files.profileImage[0];
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      file.path,
      {
        folder: `${process.env.CLOUD_FOLDER_NAME}/user/${cloudFolder}`,
      }
    );
    profileImage = { id: public_id, url: secure_url };
  } else {
    profileImage = {
      id: "default_public_id",
      url: `https://res.cloudinary.com/${process.env.CLOUDNAME}/image/upload/v1741439525/download_uoxufk.jpg`,
    };
  }

  // If role is doctor, national ID must be uploaded
  let nationalID = null;
  if (role === "doctor") {
    if (!req.files || !req.files.nationalID) {
      return next(new Error("National ID is required for doctor registration.", { cause: 400 }));
    }

    const idFile = req.files.nationalID[0];
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      idFile.path,
      {
        folder: `${process.env.CLOUD_FOLDER_NAME}/user/${cloudFolder}/nationalID`,
      }
    );
    nationalID = { id: public_id, url: secure_url };
  }

  // Create the user
  await User.create({
    ...req.body,
    password: hashedPassword,
    cloudFolder,
    profileImage,
    nationalID, // only set if role is doctor
    isVerified: role === "doctor" ? false : true, // doctors require verification
  });

  const token = jwt.sign({ email }, process.env.SECRET_KEY);

  const confirmationLink = `https://knowledge-sharing-pied.vercel.app/user/activate_account/${token}`;

  const messageSent = await sendEmail({
    to: email,
    subject: "Activate account",
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background-color: #fdfdfd; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
  <h2 style="color: #2c3e50; text-align: center;">🎉 Welcome to Our Platform!</h2>

  <p style="font-size: 16px; color: #555; text-align: center;">
    Your  account has been created successfully. To activate your account and set your password, please click the button below.
  </p>

  <div style="text-align: center; margin: 40px 0;">
    <a href="${confirmationLink}" 
       style="background-color: #28a745; 
              color: white; 
              padding: 14px 24px; 
              text-decoration: none; 
              font-size: 16px; 
              border-radius: 6px; 
              display: inline-block; 
              font-weight: bold;">
      ✅ Activate Your Account
    </a>
  </div>

  <p style="font-size: 14px; color: #777; text-align: center;">
    If you did not request this account or believe this message was sent in error, please ignore this email.
  </p>

  <p style="font-size: 14px; color: #999; text-align: center; margin-top: 30px;">
    — Accessible Hub Team
  </p>
</div>
`,
  });

  if (!messageSent) return next(new Error("Something went wrong!"));

  return res.status(200).json({
    success: true,
    message: role === "doctor"
      ? "Doctor account created successfully. Awaiting admin verification."
      : "User created successfully",
  });
});


export const activate_account = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const { email } = jwt.verify(token, process.env.SECRET_KEY);

  const user = await User.findOneAndUpdate(
    { email },
    { is_email_verified: true }
  );

  if (!user) return next(new Error("User not found!", { cause: 404 }));

  return res.status(200).send(`
  <html>
    <head>
      <title>Account Activated</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f8fb;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
        }
        .card {
          background: #fff;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          text-align: center;
          max-width: 500px;
        }
        h1 {
          color: #28a745;
        }
        p {
          font-size: 18px;
          color: #555;
        }
        a {
          display: inline-block;
          margin-top: 20px;
          padding: 12px 20px;
          background-color: #007bff;
          color: #fff;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
        }
        a:hover {
          background-color: #0056b3;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>🎉 Account Activated</h1>
        <p>Your account has been activated successfully. You can now log in.</p>
      </div>
    </body>
  </html>
`)
  
});

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

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

  const user = await User.findOne({ email });

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

  const user = await User.findOne({ email });

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

export const updateUser = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const nameFromBody = req.body.name;
  const nameFromFile = req.files?.name;
  console.log(user);

  if (req.files && req.files.profileImage) {
    const file = req.files.profileImage[0];
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      file.path,
      {
        folder: `${process.env.CLOUD_FOLDER_NAME}/user/${user.cloudFolder}`,
      }
    );
    user.profileImage = { id: public_id, url: secure_url };
    await user.save();
  }

  if (nameFromBody || nameFromFile) {
    const name = nameFromBody || nameFromFile;

    user.name = name;
    await user.save();
  }

  return res.json({
    success: true,
    message: "User updated successfully!",
  });
});

export const deleteUser = asyncHandler(async (req, res, next) => {
  const user = req.user;

  if (!user) {
    return next(new Error("User not found!", { cause: 404 }));
  }

  // Delete user tokens
  await Token.deleteMany({ user: user._id });

  // Delete user profile image from Cloudinary if not default
  if (user.profileImage && user.profileImage.id !== "default_public_id") {
    await cloudinary.uploader.destroy(user.profileImage.id);
  }

  // Delete the user
  await User.findOneAndDelete({ email: user.email });

  return res.json({
    success: true,
    message: "Your account has been deleted successfully",
  });
});
