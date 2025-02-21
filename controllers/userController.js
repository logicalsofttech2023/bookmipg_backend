import User from "../models/User.js";
import Policy from "../models/Policy.js";
import Hotel from "../models/Hotel.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import RatingReview from "../models/RatingReview.js";
import Booking from "../models/Booking.js";
import Favorite from "../models/Favorite.js";
import HotelOwnerPolicy from "../models/HotelOwnerPolicy.js";
import mongoose from "mongoose";


const MAX_ADVANCE_BOOKING_DAYS = 180;

export const addReview = async (req, res) => {
  try {
    const { hotelId, rating, review } = req.body;
    const userId = req.user.id;

    // Check if hotel exists
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res
        .status(404)
        .json({ message: "Hotel not found.", status: false });
    }

    // Handle images upload (multiple images)
    const imageUrls = req.files
      ? req.files.map((file) => file.path.split(path.sep).join("/"))
      : [];

    // Create new rating and review
    const newReview = new RatingReview({
      hotel: hotelId,
      user: userId,
      rating,
      review,
      images: imageUrls,
    });

    await newReview.save();

    res.status(201).json({
      message: "Review added successfully!",
      review: newReview,
      status: true,
    });
  } catch (error) {
    console.error("Error adding review:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message, status: false });
  }
};

export const getReviewsByHotelId = async (req, res) => {
  try {
    const { hotelId } = req.query;

    // Check if hotel exists
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res
        .status(404)
        .json({ message: "Hotel not found.", status: false });
    }

    // Fetch reviews for the given hotel
    const reviews = await RatingReview.find({ hotel: hotelId })
      .populate("user", "name profileImage")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Reviews fetched successfully!",
      reviews,
      status: true,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message, status: false });
  }
};

export const bookHotel = async (req, res) => {
  try {
    const { hotelId, checkInDate, checkOutDate, room } = req.body;
    const userId = req.user.id;

    if (!hotelId || !checkInDate || !checkOutDate || !room) {
      return res
        .status(400)
        .json({ message: "All fields are required", status: false });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res
        .status(404)
        .json({ message: "Hotel not found", status: false });
    }

    // Convert dates to proper format
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const today = new Date();

    // Validate check-in and check-out dates
    if (checkIn < today) {
      return res.status(400).json({
        message: "Check-in date must be in the future.",
        status: false,
      });
    }

    if (checkOut <= checkIn) {
      return res.status(400).json({
        message: "Check-out date must be after check-in date.",
        status: false,
      });
    }

    // Restrict advance bookings beyond 6 months
    const maxAdvanceDate = new Date();
    maxAdvanceDate.setDate(maxAdvanceDate.getDate() + MAX_ADVANCE_BOOKING_DAYS);
    if (checkIn > maxAdvanceDate) {
      return res.status(400).json({
        message: "Bookings cannot be made more than 6 months in advance.",
        status: false,
      });
    }

    // Check if the room is already booked during the selected period
    const existingBooking = await Booking.findOne({
      hotel: hotelId,
      room,
      $or: [
        { checkInDate: { $lt: checkOut }, checkOutDate: { $gt: checkIn } }, // Overlapping booking
      ],
    });

    if (existingBooking) {
      return res.status(400).json({
        message: "Selected room is already booked for these dates.",
        status: false,
      });
    }

    // Calculate total price
    const nights = (checkOut - checkIn) / (1000 * 60 * 60 * 24);
    const totalPrice = hotel.pricePerNight * nights;

    // Create new booking
    const newBooking = new Booking({
      user: userId,
      hotel: hotelId,
      room,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      totalPrice,
    });

    await newBooking.save();
    res.status(201).json({
      message: "Booking successful!",
      booking: newBooking,
      status: true,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getBookingByUserId = async (req, res) => {
  try {
    const userId = req.user.id;

    const bookings = await Booking.find({ user: userId }).populate("hotel");

    if (!bookings.length) {
      return res
        .status(404)
        .json({ message: "No bookings found", status: false });
    }

    res.status(200).json({
      message: "Bookings retrieved successfully",
      bookings,
      status: true,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId, status } = req.body;

    // Validate required fields
    if (!bookingId || !status) {
      return res
        .status(400)
        .json({ message: "Booking ID and status are required", status: false });
    }

    // Validate status value
    const validStatuses = ["pending", "confirmed", "cancelled", "upcoming"];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ message: "Invalid status value", status: false });
    }

    // Find and update the booking
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { status },
      { new: true }
    );

    if (!updatedBooking) {
      return res
        .status(404)
        .json({ message: "Booking not found", status: false });
    }

    res.status(200).json({
      message: "Booking status updated successfully",
      booking: updatedBooking,
      status: true,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getBookingByUser = async (req, res) => {
  try {
    const { userId } = req.query;

    const bookings = await Booking.find({ user: userId }).populate("hotel");

    if (!bookings.length) {
      return res
        .status(404)
        .json({ message: "No bookings found", status: false });
    }

    res.status(200).json({
      message: "Bookings retrieved successfully",
      bookings,
      status: true,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllHotelsForApp = async (req, res) => {
  try {
    const { userId } = req.user.id;
    console.log(userId);

    // Fetch all hotels
    const hotels = await Hotel.find();

    if (!hotels.length) {
      return res
        .status(404)
        .json({ message: "No hotels found", status: false });
    }

    let updatedHotels = hotels;

    // If user is authenticated, check favorites
    if (userId) {
      const userFavorites = await Favorite.find({ user: userId }).select(
        "hotel"
      );
      const favoriteHotelIds = userFavorites.map((fav) => fav.hotel.toString());

      updatedHotels = hotels.map((hotel) => ({
        ...hotel._doc,
        isFavorite: favoriteHotelIds.includes(hotel._id.toString()),
      }));
    }

    res.status(200).json({
      message: "Hotels retrieved successfully",
      status: true,
      hotels: updatedHotels,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllHotelsForWeb = async (req, res) => {
  try {
    const { userId } = req.query;
    // Fetch all hotels
    const hotels = await Hotel.find();

    if (!hotels.length) {
      return res
        .status(404)
        .json({ message: "No hotels found", status: false });
    }

    let updatedHotels = hotels;

    // If user is authenticated, check favorites
    if (userId) {
      const userFavorites = await Favorite.find({ user: userId }).select(
        "hotel"
      );
      const favoriteHotelIds = userFavorites.map((fav) => fav.hotel.toString());

      updatedHotels = hotels.map((hotel) => ({
        ...hotel._doc,
        isFavorite: favoriteHotelIds.includes(hotel._id.toString()),
      }));
    }

    res.status(200).json({
      message: "Hotels retrieved successfully",
      status: true,
      hotels: updatedHotels,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getHotelById = async (req, res) => {
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

export const getAllHotelsByFilter = async (req, res) => {
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
    } = req.query;

    // Convert page and limit to numbers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Build the filter query
    let filter = {};

    // Apply search term to multiple fields
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

    // Filter by hotel ID if provided
    if (hotelId) {
      filter._id = hotelId;
    }

    // Filter by city if provided
    if (city) {
      filter.city = { $regex: city, $options: "i" };
    }

    // Filter by state if provided
    if (state) {
      filter.state = { $regex: state, $options: "i" };
    }

    // Filter by country if provided
    if (country) {
      filter.country = { $regex: country, $options: "i" };
    }

    // Filter by zip code if provided
    if (zipCode) {
      filter.zipCode = zipCode;
    }

    // Filter by price range if provided
    if (minPrice || maxPrice) {
      filter.pricePerNight = {};
      if (minPrice) filter.pricePerNight.$gte = parseFloat(minPrice); // Minimum price
      if (maxPrice) filter.pricePerNight.$lte = parseFloat(maxPrice); // Maximum price
    }

    // Fetch filtered hotels with pagination
    const hotels = await Hotel.find(filter).skip(skip).limit(limitNumber);

    // Total count for pagination metadata
    const totalHotels = await Hotel.countDocuments(filter);

    if (!hotels.length) {
      return res
        .status(404)
        .json({ message: "No hotels found", status: false });
    }

    res.status(200).json({
      message: "Hotels retrieved successfully",
      status: true,
      hotels,
      pagination: {
        total: totalHotels,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalHotels / limitNumber),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const addFavorite = async (req, res) => {
  try {
    const { hotelId } = req.body;
    const userId = req.user.id;

    if (!hotelId)
      return res
        .status(400)
        .json({ message: "Hotel ID is required", status: false });

    // Check if the hotel exists
    const hotelExists = await Hotel.findById(hotelId);
    if (!hotelExists)
      return res
        .status(404)
        .json({ message: "Hotel not found", status: false });

    // Check if already added
    const existingFavorite = await Favorite.findOne({
      user: userId,
      hotel: hotelId,
    });
    if (existingFavorite)
      return res
        .status(400)
        .json({ message: "Already added to favorites", status: false });

    const favorite = new Favorite({ user: userId, hotel: hotelId });
    await favorite.save();

    res.status(200).json({ message: "Hotel added to favorites", status: true });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const removeFavorite = async (req, res) => {
  try {
    const { hotelId } = req.body;
    const userId = req.user.id;

    const favorite = await Favorite.findOneAndDelete({
      user: userId,
      hotel: hotelId,
    });
    if (!favorite)
      return res
        .status(404)
        .json({ message: "Favorite not found", status: false });

    res
      .status(200)
      .json({ message: "Hotel removed from favorites", status: true });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find favorite hotels of the user and populate hotel details
    const favorites = await Favorite.find({ user: userId }).populate("hotel");

    if (!favorites.length) {
      return res.status(404).json({
        message: "No favorite hotels found",
        status: false,
        favorites: [],
      });
    }

    res.status(200).json({
      message: "Favorite hotels retrieved successfully",
      status: true,
      favorites,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
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

export const getHotelOwnerPolicyByOwnerId = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized access. User ID is missing.",
      });
    }

    const { hotelId } = req.query;
    const hotelOwnerId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(hotelId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid hotelId format",
      });
    }

    const hotelOwnerPolicy = await HotelOwnerPolicy.find({ hotelOwnerId, hotelId });

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

export const getSimilarHotels = async (req, res) => {
  try {
    const { hotelId } = req.query;

    if (!mongoose.Types.ObjectId.isValid(hotelId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid hotelId format",
      });
    }

    const currentHotel = await Hotel.findById(hotelId);
    if (!currentHotel) {
      return res.status(404).json({
        status: false,
        message: "Hotel not found",
      });
    }

    // Find similar hotels based on location, price range, and amenities
    const similarHotels = await Hotel.find({
      _id: { $ne: hotelId },
      city: currentHotel.city,
      pricePerNight: { 
        $gte: currentHotel.pricePerNight * 0.8,
        $lte: currentHotel.pricePerNight * 1.2,
      },
      amenities: { $in: currentHotel.amenities },
    }).limit(10);

    if (!similarHotels.length) {
      return res.status(404).json({
        status: false,
        message: "No similar hotels found.",
      });
    }

    res.status(200).json({
      status: true,
      message: "Similar hotels retrieved successfully",
      hotels: similarHotels,
    });

  } catch (error) {
    console.error("Error fetching similar hotels:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error. Please try again later.",
      error: error.message,
    });
  }
};

export const getHotelOwnerPolicyById = async (req, res) => {
  try {
    const { hotelId } = req.query;
    if (!mongoose.Types.ObjectId.isValid(hotelId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid hotelId format",
      });
    }

    const hotelOwnerPolicy = await HotelOwnerPolicy.find({ hotelId });

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



