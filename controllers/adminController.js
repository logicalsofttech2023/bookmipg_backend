import User from "../models/User.js";
import Policy from "../models/Policy.js";
import Hotel from "../models/Hotel.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Coupon from "../models/Coupon.js";
import jwt from "jsonwebtoken";
import Booking from "../models/Booking.js";
import HotelOwnerPolicy from "../models/HotelOwnerPolicy.js";
import mongoose from "mongoose";
import RatingReview from "../models/RatingReview.js";
import Favorite from "../models/Favorite.js";
import Contact from "../models/ContactUs.js";
import bcrypt from "bcrypt";
import Admin from "../models/Admin.js";
import BestCity from "../models/BestCity.js";


const generateJwtToken = (user) => {
  return jwt.sign(
    { id: user._id, phone: user.phone, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "730d" }
  );
};

export const adminSignup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin
    const admin = await Admin.create({ name, email, password: hashedPassword });

    res.status(201).json({
      message: "Admin registered successfully",
      admin: { id: admin._id, name: admin.name, email: admin.email },
      token: generateJwtToken(admin),
    });
  } catch (error) {
    console.error("Admin Signup Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if admin exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    res.status(200).json({
      message: "Admin logged in successfully",
      admin: { id: admin._id, name: admin.name, email: admin.email },
      token: generateJwtToken(admin),
    });
  } catch (error) {
    console.error("Admin Login Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getAdminDetail = async (req, res) => {
  try {
    const adminId = req.user.id;

    // Await the query to resolve
    const admin = await Admin.findById(adminId).select("-otp -otpExpiresAt");

    if (!admin) {
      return res.status(400).json({ message: "User not found", status: false });
    }

    res.status(200).json({
      message: "Admin data fetched successfully",
      status: true,
      data: admin,
    });
  } catch (error) {
    console.error("Error fetching admin details:", error);
    res.status(500).json({ message: "Internal Server Error", status: false });
  }
};

export const resetAdminPassword = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { newPassword, confirmPassword } = req.body;

    if (!adminId || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Admin ID, new password, and confirm password are required",
        status: false,
      });
    }

    // Find admin by ID
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res
        .status(404)
        .json({ message: "Admin not found", status: false });
    }

    // Check if newPassword and confirmPassword match
    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ message: "Passwords do not match", status: false });
    }

    // Check if new password is same as old password
    const isSamePassword = await bcrypt.compare(newPassword, admin.password);
    if (isSamePassword) {
      return res.status(400).json({
        message: "New password cannot be the same as the old password",
        status: false,
      });
    }

    // Hash the new password
    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    res
      .status(200)
      .json({ message: "Password reset successful", status: true });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Internal Server Error", status: false });
  }
};

export const updateAdminDetail = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { name, email } = req.body;

    // Validate input
    if (!name || !email) {
      return res.status(400).json({
        message: "name, and email are required",
        status: false,
      });
    }

    // Find and update admin
    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      { name, email },
      { new: true, select: "-password -otp -otpExpiresAt" }
    );

    if (!updatedAdmin) {
      return res
        .status(400)
        .json({ message: "Admin not found", status: false });
    }

    res.status(200).json({
      message: "Admin details updated successfully",
      status: true,
      data: updatedAdmin,
    });
  } catch (error) {
    console.error("Error updating admin details:", error);
    res.status(500).json({ message: "Internal Server Error", status: false });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "", status } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    let searchFilter = { role: "user", name: { $exists: true, $ne: "" } };
    if (search) {
      searchFilter = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ],
      };
    }

    if (status) {
      searchFilter.status = status === "true";
    }

    const users = await User.find(searchFilter)
      .select("-otp -otpExpiresAt -password")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalUsers = await User.countDocuments(searchFilter);

    res.status(200).json({
      message: "Users fetched successfully",
      status: true,
      data: users,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      message: "Internal Server Error",
      status: false,
      error: error.message,
    });
  }
};

export const getAllOwners = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "", status } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    let searchFilter = { role: "vendor" };
    if (search) {
      searchFilter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      searchFilter.status = status === "true";
    }

    const owners = await User.find(searchFilter)
      .select("-otp -otpExpiresAt -password") // Exclude sensitive data like OTP and password
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalOwners = await User.countDocuments(searchFilter);

    res.status(200).json({
      message: "Owners fetched successfully",
      status: true,
      data: owners,
      totalOwners,
      totalPages: Math.ceil(totalOwners / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching owners:", error);
    res.status(500).json({
      message: "Internal Server Error",
      status: false,
      error: error.message,
    });
  }
};

export const policyUpdate = async (req, res) => {
  try {
    const { type, content } = req.body;
    if (!type || !content) {
      return res
        .status(400)
        .json({ message: "Type and content are required", status: false });
    }

    let policy = await Policy.findOne({ type });
    if (policy) {
      policy.content = content;
      await policy.save();
      return res
        .status(200)
        .json({ message: "Policy updated successfully", status: true, policy });
    } else {
      policy = new Policy({ type, content });
      await policy.save();
      return res
        .status(200)
        .json({ message: "Policy created successfully", status: true, policy });
    }
  } catch (error) {
    console.error("Error updating policy:", error);
    res.status(500).json({
      message: "Internal Server Error",
      status: false,
      error: error.message,
    });
  }
};

export const getPolicy = async (req, res) => {
  try {
    const { type } = req.query;
    if (!type) {
      return res
        .status(400)
        .json({ message: "Policy type is required", status: false });
    }

    const policy = await Policy.findOne({ type });
    if (!policy) {
      return res
        .status(404)
        .json({ message: "Policy not found", status: false });
    }

    res
      .status(200)
      .json({ message: "Policy fetched successfully", status: true, policy });
  } catch (error) {
    console.error("Error fetching policy:", error);
    res.status(500).json({
      message: "Internal Server Error",
      status: false,
      error: error.message,
    });
  }
};

// export const addHotel = async (req, res) => {
//   try {
//     const {
//       name,
//       address,
//       city,
//       state,
//       country,
//       zipCode,
//       pricePerNight,
//       originalPricePerNight,
//       taxesAmount,
//       rating,
//       amenities,
//       facilities,
//       latitude,
//       longitude,
//       room,
//       description,
//     } = req.body;
//     const owner = req.user.id;

//     if (
//       !name ||
//       !address ||
//       !city ||
//       !state ||
//       !country ||
//       !zipCode ||
//       !pricePerNight ||
//       !latitude ||
//       !longitude ||
//       !room ||
//       !originalPricePerNight ||
//       !taxesAmount
//     ) {
//       return res.status(400).json({
//         message: "All required fields must be provided.",
//         status: false,
//       });
//     }

//     const imageUrls = req.files.map((file) =>
//       file.path.split(path.sep).join("/")
//     );

//     const newHotel = new Hotel({
//       name,
//       address,
//       city,
//       state,
//       country,
//       zipCode,
//       pricePerNight,
//       originalPricePerNight,
//       taxesAmount,
//       room,
//       description,
//       rating: rating || 0,
//       amenities: amenities ? amenities.split(",") : [],
//       facilities: facilities ? facilities.split(",") : [],
//       images: imageUrls,
//       latitude,
//       longitude,
//       owner,
//     });

//     await newHotel.save();
//     res.status(200).json({
//       message: "Hotel added successfully!",
//       hotel: newHotel,
//       status: true,
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

export const addHotel = async (req, res) => {
  try {
    const {
      name,
      address,
      city,
      state,
      country,
      zipCode,
      pricePerNight,
      originalPricePerNight,
      taxesAmount,
      rating,
      amenities,
      facilities,
      latitude,
      longitude,
      room,
      description,
      roomTypes,
      bedType,
      size,
      type,
      capacity,
      smokingAllowed
    } = req.body;
    const owner = req.user.id;

    if (
      !name ||
      !address ||
      !city ||
      !state ||
      !country ||
      !zipCode ||
      !pricePerNight ||
      !latitude ||
      !longitude ||
      !room ||
      !originalPricePerNight ||
      !taxesAmount ||
      !roomTypes
    ) {
      return res.status(400).json({
        message: "All required fields must be provided.",
        status: false,
      });
    }

    const imageUrls = req.files.map((file) =>
      file.path.split(path.sep).join("/")
    );

    const parsedRoomTypes =
      typeof roomTypes === "string" ? JSON.parse(roomTypes) : roomTypes;

    const newHotel = new Hotel({
      name,
      address,
      city,
      state,
      country,
      zipCode,
      pricePerNight,
      originalPricePerNight,
      taxesAmount,
      room,
      description,
      rating: rating || 0,
      amenities: amenities ? amenities.split(",") : [],
      facilities: facilities ? facilities.split(",") : [],
      images: imageUrls,
      latitude,
      longitude,
      owner,
      roomTypes: parsedRoomTypes,
      bedType,
      size,
      type,
      capacity,
      smokingAllowed
    });

    await newHotel.save();
    res.status(200).json({
      message: "Hotel added successfully!",
      hotel: newHotel,
      status: true,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateHotel = async (req, res) => {
  try {
    const {
      name,
      address,
      city,
      state,
      country,
      zipCode,
      pricePerNight,
      originalPricePerNight,
      taxesAmount,
      rating,
      amenities,
      facilities,
      latitude,
      longitude,
      hotelId,
      room,
      description,
      existingImages,
      roomTypes,
      bedType,
      size,
      type,
      capacity,
      smokingAllowed
    } = req.body;

    const owner = req.user.id;

    if (!hotelId) {
      return res.status(400).json({ message: "Hotel ID is required." });
    }

    // Hotel find karein
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found." });
    }

    // Check ownership
    if (hotel.owner.toString() !== owner) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this hotel." });
    }

    // ✅ Update fields if provided
    hotel.name = name || hotel.name;
    hotel.address = address || hotel.address;
    hotel.city = city || hotel.city;
    hotel.state = state || hotel.state;
    hotel.country = country || hotel.country;
    hotel.zipCode = zipCode || hotel.zipCode;
    hotel.pricePerNight = pricePerNight || hotel.pricePerNight;
    hotel.originalPricePerNight =
      originalPricePerNight || hotel.originalPricePerNight;
    hotel.taxesAmount = taxesAmount || hotel.taxesAmount;
    hotel.room = room || hotel.room;
    hotel.description = description || hotel.description;
    hotel.rating = rating || hotel.rating;
    hotel.amenities = amenities ? amenities.split(",") : hotel.amenities;
    hotel.facilities = facilities ? facilities.split(",") : hotel.facilities;
    hotel.latitude = latitude || hotel.latitude;
    hotel.longitude = longitude || hotel.longitude;
    hotel.bedType = bedType || hotel.bedType;
    hotel.size = size || hotel.size;
    hotel.type = type || hotel.type;
    hotel.capacity = capacity || hotel.capacity;
    hotel.smokingAllowed = smokingAllowed || hotel.smokingAllowed;

    if (roomTypes) {
      hotel.roomTypes =
        typeof roomTypes === "string" ? JSON.parse(roomTypes) : roomTypes;
    }

    // ✅ Preserve old images from frontend
    let updatedImages = existingImages
      ? JSON.parse(existingImages)
      : hotel.images;

    if (req.files && req.files.length > 0) {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);

      // ✅ Purani images delete sirf tab ho jab naye images upload ho
      for (const oldImage of hotel.images) {
        if (!updatedImages.includes(oldImage)) {
          // ✅ Agar old image nahi hai existing list me toh delete karo
          const oldImagePath = path.join(__dirname, "..", oldImage);
          fs.unlink(oldImagePath, (err) => {
            if (err) console.error("Error deleting old image:", err);
          });
        }
      }

      // ✅ Nayi images ko add karo
      const newImageUrls = req.files.map((file) =>
        file.path.split(path.sep).join("/")
      );
      updatedImages = [...updatedImages, ...newImageUrls];
    }

    hotel.images = updatedImages; // ✅ Purani aur nayi images ko store karo

    // Save updated hotel
    await hotel.save();

    res.status(200).json({ message: "Hotel updated successfully!", hotel });
  } catch (error) {
    console.error("Error in updateHotel:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getByHotelId = async (req, res) => {
  try {
    const { hotelId } = req.query;

    if (!hotelId) {
      return res.status(400).json({ message: "Hotel ID is required." });
    }

    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found." });
    }

    res
      .status(200)
      .json({ message: "Get hotel successfully", status: true, hotel });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getHotelsByOwnerId = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    let { page = 1, limit = 10, search = "" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    // Search filter
    let searchFilter = { owner: ownerId };
    if (search) {
      searchFilter.$or = [
        { name: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ];
    }

    // Fetch paginated hotels
    const hotels = await Hotel.find(searchFilter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalHotels = await Hotel.countDocuments(searchFilter);

    res.status(200).json({
      message: "Get hotels successfully",
      status: true,
      data: hotels,
      totalHotels,
      totalPages: Math.ceil(totalHotels / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getHotelsByOwnerIdInAdmin = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "", ownerId } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    // Search filter
    let searchFilter = { owner: ownerId };
    if (search) {
      searchFilter.$or = [
        { name: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ];
    }

    // Fetch paginated hotels
    const hotels = await Hotel.find(searchFilter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalHotels = await Hotel.countDocuments(searchFilter);

    res.status(200).json({
      message: "Get hotels successfully",
      status: true,
      data: hotels,
      totalHotels,
      totalPages: Math.ceil(totalHotels / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteHotel = async (req, res) => {
  try {
    const { hotelId } = req.body;
    const owner = req.user.id;

    if (!hotelId) {
      return res
        .status(400)
        .json({ message: "Hotel ID is required.", status: false });
    }

    // Find the hotel by ID
    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return res
        .status(404)
        .json({ message: "Hotel not found.", status: false });
    }

    // Check if the logged-in user is the owner of the hotel
    if (hotel.owner.toString() !== owner) {
      return res.status(403).json({
        message: "You are not authorized to delete this hotel.",
        status: false,
      });
    }

    // Delete the old images associated with the hotel
    if (hotel.images && hotel.images.length > 0) {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);

      for (const oldImage of hotel.images) {
        const oldImagePath = path.join(__dirname, "..", oldImage); // Assuming images are stored in the root "images" folder
        fs.unlink(oldImagePath, (err) => {
          if (err) console.error("Error deleting old image:", err);
        });
      }
    }

    // Delete the hotel
    await Hotel.deleteOne({ _id: hotelId });

    res
      .status(200)
      .json({ message: "Hotel deleted successfully!", status: true });
  } catch (error) {
    console.error("Error deleting hotel:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message, status: false });
  }
};

export const deleteHotelImage = async (req, res) => {
  const owner = req.user.id;
  try {
    const { hotelId, imageUrl } = req.body;

    if (!hotelId || !imageUrl) {
      return res
        .status(400)
        .json({ message: "Hotel ID and image URL are required." });
    }

    // Find the hotel by ID
    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found." });
    }

    if (hotel.owner.toString() !== owner) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this image." });
    }

    // Check if the image exists in the hotel record
    const imageIndex = hotel.images.indexOf(imageUrl);
    console.log(imageIndex);

    if (imageIndex === -1) {
      return res
        .status(404)
        .json({ message: "Image not found in this hotel." });
    }

    // Remove the image from the array
    hotel.images.splice(imageIndex, 1);

    // Delete the image from the server
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const imagePath = path.join(__dirname, "..", imageUrl);

    fs.unlink(imagePath, (err) => {
      if (err) console.error("Error deleting image:", err);
    });

    // Save the updated hotel document
    await hotel.save();

    res.status(200).json({ message: "Image deleted successfully!", hotel });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      discountPercentage,
      expiryDate,
      title,
      description,
      isActive,
      type,
    } = req.body;

    // Check if coupon already exists
    const existingCoupon = await Coupon.findOne({ code });
    if (existingCoupon)
      return res.status(400).json({ message: "Coupon code already exists" });

    const newCoupon = new Coupon({
      code,
      discountPercentage,
      expiryDate,
      title,
      description,
      isActive,
      type,
    });
    await newCoupon.save();

    res
      .status(200)
      .json({ message: "Coupon created successfully", coupon: newCoupon });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.query;
    const {
      code,
      discountPercentage,
      expiryDate,
      title,
      description,
      isActive,
      type, // <- add this
    } = req.body;

    // Check if coupon exists
    const existingCoupon = await Coupon.findById(id);
    if (!existingCoupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    // Update fields
    existingCoupon.code = code || existingCoupon.code;
    existingCoupon.discountPercentage =
      discountPercentage || existingCoupon.discountPercentage;
    existingCoupon.expiryDate = expiryDate || existingCoupon.expiryDate;
    existingCoupon.title = title || existingCoupon.title;
    existingCoupon.description = description || existingCoupon.description;
    existingCoupon.isActive =
      isActive !== undefined ? isActive : existingCoupon.isActive;
    existingCoupon.type = type || existingCoupon.type; // <- set type here

    await existingCoupon.save();

    res
      .status(200)
      .json({ message: "Coupon updated successfully", coupon: existingCoupon });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.body;

    // Check if coupon exists
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    // Remove the coupon ID from all users' coupons array
    await User.updateMany({ coupons: id }, { $pull: { coupons: id } });

    // Delete the coupon
    await Coupon.findByIdAndDelete(id);

    res.status(200).json({ message: "Coupon deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getCouponById = async (req, res) => {
  try {
    const { id } = req.query;

    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    res.status(200).json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllCoupons = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    // Search query for coupon code or title
    const searchQuery = {
      $or: [
        { code: { $regex: search, $options: "i" } }, // Case-insensitive search on coupon code
        { title: { $regex: search, $options: "i" } }, // Case-insensitive search on title
      ],
    };

    // Get total count for pagination
    const totalCoupons = await Coupon.countDocuments(search ? searchQuery : {});

    // Fetch coupons with pagination, search, and sorting
    const coupons = await Coupon.find(search ? searchQuery : {})
      .sort({ [sortBy]: order === "asc" ? 1 : -1 }) // Sorting logic
      .skip((page - 1) * limit) // Skipping records for pagination
      .limit(limit); // Limiting records per page

    res.status(200).json({
      success: true,
      totalCoupons,
      totalPages: Math.ceil(totalCoupons / limit),
      currentPage: page,
      coupons,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const assignCouponToUsers = async (req, res) => {
  try {
    const { couponId, userIds } = req.body;

    // Check if coupon exists
    const coupon = await Coupon.findById(couponId);
    if (!coupon)
      return res
        .status(404)
        .json({ message: "Coupon not found", status: false });

    // Loop through users and assign coupon
    for (const userId of userIds) {
      const user = await User.findById(userId);
      if (user) {
        // Avoid duplicate coupons for users
        if (!user.coupons.includes(couponId)) {
          user.coupons.push(couponId);
          await user.save();
        }

        // Add user to coupon's assignedUsers list
        if (!coupon.assignedUsers.includes(userId)) {
          coupon.assignedUsers.push(userId);
        }
      }
    }

    await coupon.save();

    res
      .status(200)
      .json({ message: "Coupon assigned to users successfully", status: true });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getUserByIdInAdmin = async (req, res) => {
  try {
    const { userId } = req.query;
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

export const getBookingByUserIdInAdmin = async (req, res) => {
  try {
    let { status, userId, page = 1, limit = 10, search = "" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    let query = { user: userId };

    // Apply status filter if provided
    if (status) {
      if (status === "upcoming") {
        query.status = { $in: ["upcoming", "pending"] };
      } else {
        query.status = status;
      }
    }

    // Apply search filter for bookingId (case-insensitive)
    if (search) {
      query.$or = [
        { bookingId: { $regex: search, $options: "i" } }, // Search in bookingId
      ];
    }

    // Fetch user bookings with hotel details
    const bookingsQuery = Booking.find(query)
      .populate({
        path: "hotel",
        match: search ? { name: { $regex: search, $options: "i" } } : {}, // Search in hotel name
      })
      .populate({
        path: "ownerId",
        select: "phone",
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const bookings = await bookingsQuery.exec();

    // Remove entries where hotel does not match search criteria (if search is used for hotel)
    const filteredBookings = bookings.filter(
      (booking) => booking.hotel || search.match(/^[a-zA-Z0-9]+$/) // Ensure bookingId search is not filtered out
    );

    if (!filteredBookings.length) {
      return res
        .status(404)
        .json({ message: "No bookings found", status: false });
    }

    // Fetch total count for pagination
    const totalBookings = await Booking.countDocuments(query);

    // Fetch hotel policies based on hotelId for all bookings
    const bookingsWithPolicies = await Promise.all(
      filteredBookings.map(async (booking) => {
        const policies = await HotelOwnerPolicy.find({
          hotelId: booking.hotel?._id,
        });

        return {
          ...booking.toObject(),
          hotelOwnerPolicies: policies.map((policy) => ({
            type: policy.type,
            content: policy.content,
          })),
        };
      })
    );

    res.status(200).json({
      message: "Bookings retrieved successfully",
      bookings: bookingsWithPolicies,
      totalBookings,
      totalPages: Math.ceil(totalBookings / limit),
      currentPage: page,
      status: true,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getReviewsByUserIdInAdmin = async (req, res) => {
  try {
    let { userId, page = 1, limit = 10, search = "" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found.", status: false });
    }

    // Build query object for searching reviews
    let query = { user: userId };

    // Search by hotel name or review content
    if (search) {
      query.$or = [
        { review: { $regex: search, $options: "i" } }, // Search in review text
      ];
    }

    // Fetch user reviews with pagination & hotel details
    const reviews = await RatingReview.find(query)
      .populate({
        path: "hotel",
        select: "name images", // Include hotel name and images
        match: search ? { name: { $regex: search, $options: "i" } } : {}, // Search in hotel name
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Filter out reviews where the hotel does not match the search criteria
    const filteredReviews = reviews.filter((review) => review.hotel);

    if (!filteredReviews.length) {
      return res
        .status(404)
        .json({ message: "No reviews found.", status: false });
    }

    // Get total count for pagination
    const totalReviews = await RatingReview.countDocuments(query);

    res.status(200).json({
      message: "Reviews fetched successfully!",
      reviews: filteredReviews,
      totalReviews,
      totalPages: Math.ceil(totalReviews / limit),
      currentPage: page,
      status: true,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message, status: false });
  }
};

export const getAllReviewsInAdmin = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    let query = {};

    // Search by review content or hotel name
    if (search) {
      query.$or = [
        { review: { $regex: search, $options: "i" } }, // Search in review text
      ];
    }

    // Fetch reviews with pagination & hotel and user details
    const reviews = await RatingReview.find(query)
      .populate({
        path: "hotel",
        select: "name images",
        match: search ? { name: { $regex: search, $options: "i" } } : {}, // Search in hotel name
      })
      .populate({
        path: "user",
        select: "name profileImage",
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Filter out reviews where the hotel does not match the search criteria
    const filteredReviews = reviews.filter((review) => review.hotel);

    if (!filteredReviews.length) {
      return res
        .status(404)
        .json({ message: "No reviews found.", status: false });
    }

    // Get total count for pagination
    const totalReviews = await RatingReview.countDocuments(query);

    res.status(200).json({
      message: "Reviews fetched successfully!",
      reviews: filteredReviews,
      totalReviews,
      totalPages: Math.ceil(totalReviews / limit),
      currentPage: page,
      status: true,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message, status: false });
  }
};

export const verifyUserByAdmin = async (req, res) => {
  try {
    const { adminVerify, userId } = req.body;

    if (typeof adminVerify !== "boolean") {
      return res.status(400).json({
        message: "Invalid value for adminVerify. It should be true or false.",
        status: false,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found", status: false });
    }

    user.adminVerify = adminVerify;
    await user.save();

    res.status(200).json({
      message: `User verification status updated to ${adminVerify}`,
      status: true,
      data: user,
    });
  } catch (error) {
    console.error("Error updating user verification status:", error);
    res.status(500).json({
      message: "Internal Server Error",
      status: false,
      error: error.message,
    });
  }
};

export const getAllBookingByOwnerId = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status, ownerId } = req.query;

    const query = {
      ownerId,
      $or: [
        { name: { $regex: search, $options: "i" } },
        { number: { $regex: search, $options: "i" } },
        { bookingId: { $regex: search, $options: "i" } },
      ],
    };

    if (status) {
      query.status = status;
    }

    const totalBookings = await Booking.countDocuments(query);

    const bookings = await Booking.find(query)
      .populate("hotel", "name")
      .populate("user", "name phone email profileImage")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({
      message: "Bookings retrieved successfully",
      bookings,
      totalPages: Math.ceil(totalBookings / limit),
      currentPage: parseInt(page),
      totalBookings,
      status: true,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllReviewByOwnerId = async (req, res) => {
  try {
    let { ownerId, page = 1, limit = 10, search = "" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    // Find all hotels owned by the given ownerId
    const hotels = await Hotel.find({ owner: ownerId }).select("_id");

    if (!hotels.length) {
      return res
        .status(404)
        .json({ message: "No hotels found for this owner.", status: false });
    }

    // Extract hotel IDs
    const hotelIds = hotels.map((hotel) => hotel._id);

    // Build query to fetch reviews for the owner's hotels
    let query = { hotel: { $in: hotelIds } };

    // Search reviews by content
    if (search) {
      query.$or = [{ review: { $regex: search, $options: "i" } }];
    }

    // Fetch reviews with hotel and user details
    const reviews = await RatingReview.find(query)
      .populate({
        path: "hotel",
        select: "name images",
      })
      .populate({
        path: "user",
        select: "name profileImage",
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    if (!reviews.length) {
      return res
        .status(404)
        .json({ message: "No reviews found.", status: false });
    }

    // Count total reviews for pagination
    const totalReviews = await RatingReview.countDocuments(query);

    res.status(200).json({
      message: "Reviews fetched successfully!",
      reviews,
      totalReviews,
      totalPages: Math.ceil(totalReviews / limit),
      currentPage: page,
      status: true,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message, status: false });
  }
};

export const getAllHotelsByInAdmin = async (req, res) => {
  try {
    const {
      search = "",
      page = 1,
      limit = 10,
      hotelId,
      city,
      state,
      country,
      zipCode,
      minPrice,
      maxPrice,
      amenities,
      latitude,
      longitude,
      radius = 5000,
      adminVerify,
    } = req.query;

    const userId = req.user?.id;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    let filter = {};

    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      filter.$or = [
        { name: searchRegex },
        { city: searchRegex },
        { state: searchRegex },
        { country: searchRegex },
        { zipCode: searchRegex },
      ];
    }

    if (hotelId) filter._id = hotelId;
    if (city) filter.city = { $regex: city, $options: "i" };
    if (state) filter.state = { $regex: state, $options: "i" };
    if (country) filter.country = { $regex: country, $options: "i" };
    if (zipCode) filter.zipCode = zipCode;

    if (minPrice || maxPrice) {
      filter.pricePerNight = {};
      if (minPrice) filter.pricePerNight.$gte = parseFloat(minPrice);
      if (maxPrice) filter.pricePerNight.$lte = parseFloat(maxPrice);
    }

    if (amenities) {
      const amenitiesArray = Array.isArray(amenities)
        ? amenities
        : amenities.split(",");
      filter.amenities = { $all: amenitiesArray };
    }

    // **New filter for admin verification**
    if (adminVerify === "true") {
      filter.adminVerify = true;
    } else if (adminVerify === "false") {
      filter.adminVerify = false;
    }

    let hotels = await Hotel.find(filter).skip(skip).limit(limitNumber);
    const totalHotels = await Hotel.countDocuments(filter);

    if (!hotels.length) {
      return res
        .status(404)
        .json({ message: "No hotels found", status: false });
    }

    const hotelIds = hotels.map((hotel) => hotel._id);

    // Fetch review counts
    const reviewCounts = await RatingReview.aggregate([
      { $match: { hotel: { $in: hotelIds } } },
      { $group: { _id: "$hotel", count: { $sum: 1 } } },
    ]);

    const reviewCountMap = reviewCounts.reduce((acc, cur) => {
      acc[cur._id.toString()] = cur.count;
      return acc;
    }, {});

    // Fetch favorite status
    let favoriteHotels = [];
    if (userId) {
      favoriteHotels = await Favorite.find({
        user: userId,
        hotel: { $in: hotelIds },
      });
    }
    const favoriteHotelIds = new Set(
      favoriteHotels.map((fav) => fav.hotel.toString())
    );

    let updatedHotels = hotels.map((hotel) => ({
      ...hotel._doc,
      reviewCount: reviewCountMap[hotel._id.toString()] || 0,
      isFavorite: favoriteHotelIds.has(hotel._id.toString()),
    }));

    if (latitude && longitude && radius) {
      updatedHotels = updatedHotels.filter((hotel) => {
        const distance = geolib.getDistance(
          { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
          { latitude: hotel.latitude, longitude: hotel.longitude }
        );
        return distance <= parseFloat(radius);
      });
    }

    res.status(200).json({
      message: "Hotels retrieved successfully",
      status: true,
      hotels: updatedHotels,
      total: totalHotels,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalHotels / limitNumber),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllVendors = async (req, res) => {
  try {
    const vendors = await User.find({ role: "vendor" }).select(
      "-otp -otpExpiresAt -password"
    );

    return res.status(200).json({
      message: "Vendors fetched successfully",
      status: true,
      data: vendors,
    });
  } catch (error) {
    console.error("Error fetching vendors:", error.message);

    return res.status(500).json({
      message: "Internal Server Error",
      status: false,
      error: error.message,
    });
  }
};

export const verifyHotelByAdmin = async (req, res) => {
  try {
    const { adminVerify, hotelId } = req.body;

    if (typeof adminVerify !== "boolean") {
      return res.status(400).json({
        message: "Invalid value for adminVerify. It should be true or false.",
        status: false,
      });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res
        .status(404)
        .json({ message: "Hotel not found", status: false });
    }

    hotel.adminVerify = adminVerify;
    await hotel.save();

    res.status(200).json({
      message: `Hotel verification status updated to ${adminVerify}`,
      status: true,
      data: hotel,
    });
  } catch (error) {
    console.error("Error updating hotel verification status:", error);
    res.status(500).json({
      message: "Internal Server Error",
      status: false,
      error: error.message,
    });
  }
};

export const getAllBookingsInAdmin = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10, status, ownerId } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    let query = {};

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter by ownerId if provided
    if (ownerId) {
      query.ownerId = ownerId;
    }

    // Fetch total count for pagination
    const totalBookings = await Booking.countDocuments(query);

    // Fetch paginated bookings with hotel details
    const bookings = await Booking.find(query)
      .populate("hotel")
      .populate({ path: "ownerId", select: "phone" })
      .sort({ createdAt: -1 }) // Latest bookings first
      .skip(skip)
      .limit(limitNumber);

    if (!bookings.length) {
      return res
        .status(404)
        .json({ message: "No bookings found", status: false });
    }

    // Fetch hotel policies for each booking
    const bookingsWithPolicies = await Promise.all(
      bookings.map(async (booking) => {
        const policies = await HotelOwnerPolicy.find({
          hotelId: booking.hotel._id,
        });
        return {
          ...booking.toObject(),
          hotelOwnerPolicies: policies.map((policy) => ({
            type: policy.type,
            content: policy.content,
          })),
        };
      })
    );

    res.status(200).json({
      message: "Bookings retrieved successfully",
      bookings: bookingsWithPolicies,
      total: totalBookings,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalBookings / limitNumber),
      status: true,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getContacts = async (req, res) => {
  try {
    // Fetch contacts with pagination and search
    const contacts = await Contact.findOne();

    res.status(200).json({
      status: true,
      contacts,
    });
  } catch (error) {
    console.error("Error in getContacts:", error);
    res.status(500).json({ message: "Server Error", status: false });
  }
};

export const addOrUpdateContact = async (req, res) => {
  try {
    const { name, email, mobile } = req.body;

    // Find existing contact for the user
    let contact = await Contact.findOne();

    if (contact) {
      // Update the existing contact
      contact.name = name;
      contact.email = email;
      contact.mobile = mobile;
      await contact.save();

      res.status(200).json({
        message: "Contact updated successfully",
        status: true,
        contact,
      });
    } else {
      // Create a new contact
      const newContact = new Contact({
        name,
        email,
        mobile,
      });
      await newContact.save();

      res.status(201).json({
        message: "Contact added successfully",
        status: true,
        contact: newContact,
      });
    }
  } catch (error) {
    console.error("Error in addOrUpdateContact:", error);
    res.status(500).json({ message: "Server Error", status: false });
  }
};

export const getAllCustomer = async (req, res) => {
  try {
    const users = await User.find({
      role: "user",
      name: { $exists: true, $ne: "" },
    }).select("-otp -otpExpiresAt -password");

    return res.status(200).json({
      message: "User fetched successfully",
      status: true,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error.message);

    return res.status(500).json({
      message: "Internal Server Error",
      status: false,
      error: error.message,
    });
  }
};

export const getUsersAssignedToCoupon = async (req, res) => {
  try {
    let { page = 1, limit = 10, couponId } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    // Check if coupon exists
    const coupon = await Coupon.findById(couponId).populate("assignedUsers");

    if (!coupon) {
      return res
        .status(404)
        .json({ message: "Coupon not found", status: false });
    }

    const totalUsers = coupon.assignedUsers.length;

    const totalPages = Math.ceil(totalUsers / limit);

    // Apply pagination
    const assignedUsers = coupon.assignedUsers
      .slice((page - 1) * limit, page * limit)
      .map((user) => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
      }));

    res.status(200).json({
      message: "Users assigned to coupon retrieved successfully",
      status: true,
      currentPage: page,
      totalPages,
      totalUsers,
      data: assignedUsers,
      coupon,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const dashboardData = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalBookings = await Booking.countDocuments();
    const totalHotelOwner = await User.countDocuments({ role: "vendor" });
    const totalHotel = await Hotel.countDocuments();
    const totalPendingBooking = await Booking.countDocuments({
      status: "pending",
    });
    const totalCompletedBooking = await Booking.countDocuments({
      status: "completed",
    });
    const totalCancelledBooking = await Booking.countDocuments({
      status: "cancelled",
    });
    const totalUpcomingBooking = await Booking.countDocuments({
      status: "upcoming",
    });

    res.status(200).json({
      status: true,
      totalUsers,
      totalBookings,
      totalHotelOwner,
      totalHotel,
      totalPendingBooking,
      totalCompletedBooking,
      totalCancelledBooking,
      totalUpcomingBooking,
    });
  } catch (error) {
    console.error("Error in dashboardData:", error);
    res.status(500).json({ message: "Server Error", status: false });
  }
};

export const verifyHotelByOwner = async (req, res) => {
  try {
    const { adminVerify, hotelId } = req.body;

    if (typeof adminVerify !== "boolean") {
      return res.status(400).json({
        message: "Invalid value for adminVerify. It should be true or false.",
        status: false,
      });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res
        .status(404)
        .json({ message: "Hotel not found", status: false });
    }

    hotel.adminVerify = adminVerify;
    await hotel.save();

    res.status(200).json({
      message: `Hotel available status updated to ${adminVerify}`,
      status: true,
      data: hotel,
    });
  } catch (error) {
    console.error("Error updating user verification status:", error);
    res.status(500).json({
      message: "Internal Server Error",
      status: false,
      error: error.message,
    });
  }
};

export const getHotelOwnerPolicyByOwnerId = async (req, res) => {
  try {
    const ownerId = req.user.id;

    const hotelOwnerPolicy = await HotelOwnerPolicy.find({
      hotelOwnerId: ownerId,
    });

    if (!hotelOwnerPolicy || hotelOwnerPolicy.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No policies found for this hotel and owner.",
      });
    }

    res.status(200).json({ status: true, data: hotelOwnerPolicy });
  } catch (error) {
    console.error("Error fetching hotel owner policy:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error. Please try again later.",
      error: error.message,
    });
  }
};

export const updateHotelOwnerPolicy = async (req, res) => {
  try {
    let hotelOwnerId = req.user.id;
    const { type, content, hotelId } = req.body;

    // Validate required fields
    if (!type || !content || !hotelId) {
      return res.status(400).json({
        message: "All fields (type, content, hotelId) are required",
        status: false,
      });
    }

    // Ensure `hotelId` is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(hotelId)) {
      return res.status(400).json({
        message: "Invalid hotelId format",
        status: false,
      });
    }

    // Ensure `content` is an array
    if (!Array.isArray(content) || content.length === 0) {
      return res.status(400).json({
        message: "Content must be a non-empty array of points",
        status: false,
      });
    }

    let hotelOwnerPolicy = await HotelOwnerPolicy.findOne({
      hotelOwnerId,
      hotelId,
      type,
    });

    if (hotelOwnerPolicy) {
      hotelOwnerPolicy.content = content;
      await hotelOwnerPolicy.save();
      return res.status(200).json({
        message: "Hotel owner policy updated successfully",
        status: true,
        hotelOwnerPolicy,
      });
    } else {
      hotelOwnerPolicy = new HotelOwnerPolicy({
        hotelOwnerId,
        hotelId,
        type,
        content,
      });
      await hotelOwnerPolicy.save();
      return res.status(201).json({
        message: "Hotel owner policy created successfully",
        status: true,
        hotelOwnerPolicy,
      });
    }
  } catch (error) {
    console.error("Error updating hotel owner policy:", error);
    res.status(500).json({
      message: "Internal server error. Please try again later.",
      status: false,
      error: error.message,
    });
  }
};

export const updateCheckInCheckOutTimes = async (req, res) => {
  try {
    let hotelOwnerId = req.user.id;
    const { hotelId, checkInTime, checkOutTime } = req.body;

    // Validate required fields
    if (!hotelId || !checkInTime || !checkOutTime) {
      return res.status(400).json({
        message: "hotelId, checkInTime, and checkOutTime are required",
        status: false,
      });
    }

    // Ensure `hotelId` is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(hotelId)) {
      return res.status(400).json({
        message: "Invalid hotelId format",
        status: false,
      });
    }

    // Validate time format (HH:mm)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(checkInTime) || !timeRegex.test(checkOutTime)) {
      return res.status(400).json({
        message: "Invalid time format. Use HH:mm (24-hour format).",
        status: false,
      });
    }

    // Find the "house" policy for this hotel owner
    let hotelOwnerPolicy = await HotelOwnerPolicy.findOne({
      hotelOwnerId,
      hotelId,
      type: "house",
    });

    if (!hotelOwnerPolicy) {
      // Create a new policy if none exists
      hotelOwnerPolicy = new HotelOwnerPolicy({
        hotelOwnerId,
        hotelId,
        type: "house",
        content: [], // Initialize as an empty array
        checkInTime,
        checkOutTime,
      });
    } else {
      // Update existing policy
      hotelOwnerPolicy.checkInTime = checkInTime;
      hotelOwnerPolicy.checkOutTime = checkOutTime;
    }

    await hotelOwnerPolicy.save();

    return res.status(200).json({
      message: "Check-in and Check-out times updated successfully",
      status: true,
      hotelOwnerPolicy,
    });
  } catch (error) {
    console.error("Error updating check-in/check-out times:", error);
    res.status(500).json({
      message: "Internal server error. Please try again later.",
      status: false,
      error: error.message,
    });
  }
};

export const createBestCity = async (req, res) => {
  try {
    const { cityName, hotelCount } = req.body;
    const image = req.file ? req.file.path.split(path.sep).join("/") : "";
    const bestCity = new BestCity({ image, cityName, hotelCount });
    await bestCity.save();
    res
      .status(200)
      .json({
        success: true,
        message: "Best City created successfully",
        data: bestCity,
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBestCity = async (req, res) => {
  try {
    const { id } = req.query;
    const { cityName, hotelCount } = req.body;
    const image = req.file ? req.file.path.split(path.sep).join("/") : null;

    const updateData = {
      cityName,
      hotelCount,
    };

    if (image) {
      updateData.image = image;
    }

    const updatedCity = await BestCity.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedCity) {
      return res.status(404).json({
        success: false,
        message: "Best City not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Best City updated successfully",
      data: updatedCity,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllBestCities = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const query = {};

    if (search) {
      query.cityName = { $regex: search, $options: "i" }; // Case-insensitive search
    }

    const total = await BestCity.countDocuments(query);

    const bestCities = await BestCity.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: bestCities,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBestCityById = async (req, res) => {
  try {
    const { id } = req.query;
    const bestCity = await BestCity.findById(id);
    if (!bestCity) {
      return res
        .status(404)
        .json({ success: false, message: "Best City not found" });
    }
    res.status(200).json({ success: true, data: bestCity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
