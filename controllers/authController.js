import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import User from "../models/User.js";
import path from "path";
import { sendNotification } from "../utils/notification.js";
import axios from "axios";
import qs from "qs";

const generateJwtToken = (user) => {
  return jwt.sign(
    { id: user._id, phone: user.phone, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const generateFourDigitOtp = () => {
  return Math.floor(1000 + Math.random() * 9000).toString(); // Generates a random 4-digit number
};

// export const generateOtp = async (req, res) => {
//   try {
//     const { phone, countryCode } = req.body;
//     if (!phone || !countryCode) {
//       return res.status(400).json({
//         message: "phone,countryCode number is required",
//         status: false,
//       });
//     }

//     let user = await User.findOne({ phone });

//     const generatedOtp = generateFourDigitOtp();
//     const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

//     if (user) {
//       user.otp = generatedOtp;
//       user.otpExpiresAt = otpExpiresAt;
//     } else {
//       user = new User({
//         phone,
//         countryCode,
//         otp: generatedOtp,
//         otpExpiresAt,
//       });
//     }
//     await user.save();

//     res.status(200).json({
//       message: "OTP generated successfully",
//       status: true,
//       data: user,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Server Error", status: false });
//   }
// };

export const generateOtp = async (req, res) => {
  try {
    const { phone, countryCode } = req.body;
    if (!phone || !countryCode) {
      return res.status(400).json({
        message: "phone, countryCode is required",
        status: false,
      });
    }

    let user = await User.findOne({ phone });

    const generatedOtp = generateFourDigitOtp();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    if (user) {
      user.otp = generatedOtp;
      user.otpExpiresAt = otpExpiresAt;
    } else {
      user = new User({
        phone,
        countryCode,
        otp: generatedOtp,
        otpExpiresAt,
      });
    }

    await user.save();

    // Send OTP using Ping4SMS
    const apiKey = `${process.env.PING4SMS_API_KEY}`;
    const senderId = `${process.env.PING4SMS_SENDER_ID}`;
    const route = 2;
    const templateId = `${process.env.PING4SMS_TEMPLATE_ID}`;

    const queryParams = qs.stringify({
      key: apiKey,
      sender: senderId,
      number: `${phone}`,
      route,
      sms: `Dear customer, use this One Time Password ${generatedOtp} to log in to your Bookmipg Hotel account. This OTP will be valid for the next 5 mins.`,
      templateid: templateId,
    });

    const smsUrl = `https://site.ping4sms.com/api/smsapi?${queryParams}`;
    axios
      .get(smsUrl)
      .then((response) => {
        console.log("SMS Response:", response);
      })
      .catch((error) => {
        console.error("SMS Sending Failed:", error);
      });

    res.status(200).json({
      message: "OTP generated and sent successfully",
      status: true,
      data: user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error", status: false, error });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { phone, countryCode, otp, firebaseToken } = req.body;

    if (!phone || !countryCode || !otp) {
      return res.status(400).json({
        message: "Phone number, country code, and OTP are required",
        status: false,
      });
    }

    let user = await User.findOne({ phone, countryCode });

    if (!user || user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP", status: false });
    }

    if (new Date() > new Date(user.otpExpiresAt)) {
      return res.status(400).json({ message: "OTP expired", status: false });
    }

    user.otpExpiresAt = "";
    user.isVerified = true;
    user.firebaseToken = firebaseToken;
    await user.save();

    // ✅ Send Push Notification after saving firebaseToken
    // await sendNotification(
    //   firebaseToken,
    //   "Login Successful",
    //   `Welcome back, ${user.name || "User"}!`
    // );

    let token = "";
    let userExit = false;
    if (user.name) {
      token = generateJwtToken(user);
      userExit = true;
    }

    const formattedUser = {
      _id: user._id,
      userEmail: user.userEmail || "",
      phone: user.phone || "",
      countryCode: user.countryCode || "",
      profileImage: user.profileImage || "",
      otp: user.otp || "",
      otpExpiresAt: user.otpExpiresAt || "",
      isVerified: user.isVerified,
      role: user.role || "user",
      firebaseToken: firebaseToken || "",
      name: user.name || "",
      dob: user.dob || "",
      gender: user.gender || "",
      maritalStatus: user.maritalStatus || "",
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(200).json({
      message: "OTP verified successfully",
      status: true,
      token,
      userExit,
      data: formattedUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", status: false, error });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { phone, countryCode } = req.body;
    if (!phone) {
      return res.status(400).json({
        message: "Phone number and country code are required",
        status: false,
      });
    }

    let user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ message: "User not found", status: false });
    }

    const generatedOtp = generateFourDigitOtp();
    user.otp = generatedOtp;
    user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    // Send OTP using Ping4SMS
    const apiKey = `${process.env.PING4SMS_API_KEY}`;
    const senderId = `${process.env.PING4SMS_SENDER_ID}`;
    const route = 2;
    const templateId = `${process.env.PING4SMS_TEMPLATE_ID}`;

    const queryParams = qs.stringify({
      key: apiKey,
      sender: senderId,
      number: `${phone}`,
      route,
      sms: `Dear customer, use this One Time Password ${generatedOtp} to log in to your Bookmipg Hotel account. This OTP will be valid for the next 5 mins.`,
      templateid: templateId,
    });

    const smsUrl = `https://site.ping4sms.com/api/smsapi?${queryParams}`;
    axios
      .get(smsUrl)
      .then((response) => {
        console.log("SMS Response:", response.data);
      })
      .catch((error) => {
        console.error("SMS Sending Failed:", error);
      });

    res.status(200).json({
      message: "OTP resent successfully",
      status: true,
      data: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", status: false, error });
  }
};

export const completeRegistration = async (req, res) => {
  try {
    const {
      phone,
      name,
      userEmail,
      role,
      firebaseToken,
      dob,
      gender,
      maritalStatus,
      password
    } = req.body;
    const profileImage = req.file ? req.file.path : "";

    let user = await User.findOne({ phone });
    if (!user || !user.isVerified) {
      return res
        .status(400)
        .json({ message: "User not verified", status: false });
    }

    if (!name) {
      return res
        .status(400)
        .json({ message: "Name are required", status: false });
    }

    user.name = name;
    user.userEmail = userEmail;
    user.role = role;
    user.dob = dob;
    user.gender = gender;
    user.maritalStatus = maritalStatus;
    user.profileImage = profileImage;
    user.isVerified = false;
    user.firebaseToken = firebaseToken || "";
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }
    await user.save();

    const token = generateJwtToken(user);

    res.status(201).json({
      message: "User registered successfully",
      status: true,
      token,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", status: false, error });
  }
};

export const VendorLogin = async (req, res) => {
  try {
    const { userEmail, password } = req.body;

    // Validate
    if (!userEmail || !password) {
      return res.status(400).json({
        message: "userEmail and password are required",
        status: false,
      });
    }

    console.log(req.body);
    

    // Find user by userEmail
    const user = await User.findOne({
      $or: [{ userEmail: userEmail }, { phone: userEmail }],
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        status: false,
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
        status: false,
      });
    }

    // Generate JWT token
    const token = generateJwtToken(user);
    res.status(200).json({
      message: "Login successful",
      status: true,
      token,
      data: user,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
      status: false,
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, userEmail, dob, gender, maritalStatus } = req.body;

    // Fixing profile image path
    const profileImage = req.file
      ? req.file.path.split(path.sep).join("/")
      : "";

    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found", status: false });
    }

    // Update fields
    if (name) user.name = name;
    if (userEmail) user.userEmail = userEmail;
    if (dob) user.dob = dob;
    if (gender) user.gender = gender;
    if (maritalStatus) user.maritalStatus = maritalStatus;
    if (profileImage) user.profileImage = profileImage;

    await user.save();

    res
      .status(200)
      .json({ message: "Profile updated successfully", status: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", status: false });
  }
};

export const getUserById = async (req, res) => {
  try {
    const userId = req.user.id;
    let user = await User.findById(userId).select("-otp -otpExpiresAt"); // Exclude sensitive fields
    if (!user) {
      return res.status(404).json({ message: "User not found", status: false });
    }

    res
      .status(200)
      .json({ message: "User fetched successfully", status: true, data: user });
  } catch (error) {
    res.status(500).json({ message: "Server Error", status: false });
  }
};
