import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import User from "../models/User.js";
import path from "path";

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

export const generateOtp = async (req, res) => {
  try {
    const { phone, countryCode } = req.body;
    if (!phone || !countryCode) {
      return res.status(400).json({
        message: "phone,countryCode number is required",
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

    res.status(200).json({
      message: "OTP generated successfully",
      status: true,
      data: user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error", status: false });
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
    await user.save();

    let token = "";
    let userExit = false;
    if (user.name) {
      token = generateJwtToken(user);
      userExit = true;
    }

    const formattedUser = {
      _id: user._id,
      email: user.email || "",
      phone: user.phone || "",
      countryCode: user.countryCode || "",
      profileImage: user.profileImage || "",
      otp: user.otp || "",
      otpExpiresAt: user.otpExpiresAt || "",
      isVerified: user.isVerified,
      role: user.role || "user",
      firebaseToken: firebaseToken || "",
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
    res.status(500).json({ message: "Server Error", status: false });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { phone, countryCode } = req.body;
    if (!phone || !countryCode) {
      return res.status(400).json({
        message: "Phone number and country code are required",
        status: false,
      });
    }

    let user = await User.findOne({ phone, countryCode });
    if (!user) {
      return res.status(400).json({ message: "User not found", status: false });
    }

    const generatedOtp = generateFourDigitOtp();
    user.otp = generatedOtp;
    user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    res
      .status(200)
      .json({ message: "OTP resent successfully", status: true, data: user });
  } catch (error) {
    res.status(500).json({ message: "Server Error", status: false });
  }
};

export const completeRegistration = async (req, res) => {
  try {
    const {
      phone,
      name,
      email,
      role,
      firebaseToken,
      dob,
      gender,
      maritalStatus,
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
    user.email = email;
    user.role = role;
    user.dob = dob;
    user.gender = gender;
    user.maritalStatus = maritalStatus;
    user.profileImage = profileImage;
    user.isVerified = false;
    user.firebaseToken = firebaseToken || "";
    await user.save();

    const token = generateJwtToken(user);

    res.status(201).json({
      message: "User registered successfully",
      status: true,
      token,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", status: false });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, dob, gender, maritalStatus } = req.body;

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
    if (email) user.email = email;
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
