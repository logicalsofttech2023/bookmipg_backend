import User from "../models/User.js";
import Policy from "../models/Policy.js";
import Hotel from "../models/Hotel.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

export const getAllUsers = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "", status } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    let searchFilter = { role: "user" };
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
      rating,
      amenities,
      facilities,
      latitude,
      longitude,
      room,
      description,
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
      !room
    ) {
      return res.status(400).json({
        message: "All required fields must be provided.",
        status: false,
      });
    }

    const imageUrls = req.files.map((file) =>
      file.path.split(path.sep).join("/")
    );

    const newHotel = new Hotel({
      name,
      address,
      city,
      state,
      country,
      zipCode,
      pricePerNight,
      room,
      description,
      rating: rating || 0,
      amenities: amenities ? amenities.split(",") : [],
      facilities: facilities ? facilities.split(",") : [],
      images: imageUrls,
      latitude,
      longitude,
      owner,
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
      rating,
      amenities,
      facilities,
      latitude,
      longitude,
      hotelId,
      room,
      description,
      existingImages, // ✅ Purani images ko preserve karne ke liye
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
      return res.status(403).json({ message: "You are not authorized to update this hotel." });
    }

    // ✅ Update fields if provided
    hotel.name = name || hotel.name;
    hotel.address = address || hotel.address;
    hotel.city = city || hotel.city;
    hotel.state = state || hotel.state;
    hotel.country = country || hotel.country;
    hotel.zipCode = zipCode || hotel.zipCode;
    hotel.pricePerNight = pricePerNight || hotel.pricePerNight;
    hotel.room = room || hotel.room;
    hotel.description = description || hotel.description;
    hotel.rating = rating || hotel.rating;
    hotel.amenities = amenities ? amenities.split(",") : hotel.amenities;
    hotel.facilities = facilities ? facilities.split(",") : hotel.facilities;
    hotel.latitude = latitude || hotel.latitude;
    hotel.longitude = longitude || hotel.longitude;

    // ✅ Preserve old images from frontend
    let updatedImages = existingImages ? JSON.parse(existingImages) : hotel.images;

    if (req.files && req.files.length > 0) {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);

      // ✅ Purani images delete sirf tab ho jab naye images upload ho
      for (const oldImage of hotel.images) {
        if (!updatedImages.includes(oldImage)) { // ✅ Agar old image nahi hai existing list me toh delete karo
          const oldImagePath = path.join(__dirname, "..", oldImage);
          fs.unlink(oldImagePath, (err) => {
            if (err) console.error("Error deleting old image:", err);
          });
        }
      }

      // ✅ Nayi images ko add karo
      const newImageUrls = req.files.map((file) => file.path.split(path.sep).join("/"));
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
    const ownerId = req.user.id;
    const hotels = await Hotel.find({ owner: ownerId });

    if (hotels.length === 0) {
      return res
        .status(404)
        .json({ message: "No hotels found for this owner." });
    }

    res
      .status(200)
      .json({ message: "Get hotels successfully", status: true, hotels });
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
      return res.status(400).json({ message: "Hotel ID and image URL are required." });
    }

    // Find the hotel by ID
    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found." });
    }

    if (hotel.owner.toString() !== owner) {
      return res.status(403).json({ message: "You are not authorized to delete this image." });
    }

    // Check if the image exists in the hotel record
    const imageIndex = hotel.images.indexOf(imageUrl);
    console.log(imageIndex);
    
    if (imageIndex === -1) {
      return res.status(404).json({ message: "Image not found in this hotel." });
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
