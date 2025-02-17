import User from "../models/User.js";
import Policy from "../models/Policy.js";
import Hotel from "../models/Hotel.js";
import path from "path";
import fs from 'fs';
import { fileURLToPath } from 'url';
import RatingReview from "../models/RatingReview.js";
import Booking  from "../models/Booking.js";

const MAX_ADVANCE_BOOKING_DAYS = 180;

export const addReview = async (req, res) => {
    try {
      const { hotelId, rating, review } = req.body;
      const userId = req.user.id;
  
      // Check if hotel exists
      const hotel = await Hotel.findById(hotelId);
      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found.", status: false });
      }
  
      // Handle images upload (multiple images)
      const imageUrls = req.files ? req.files.map(file => file.path.split(path.sep).join("/")) : [];
  
      // Create new rating and review
      const newReview = new RatingReview({
        hotel: hotelId,
        user: userId,
        rating,
        review,
        images: imageUrls,
      });
  
      await newReview.save();
  
      res.status(201).json({ message: "Review added successfully!", review: newReview, status: true });
    } catch (error) {
      console.error("Error adding review:", error);
      res.status(500).json({ message: "Server error", error: error.message, status: false });
    }
};

export const getReviewsByHotelId = async (req, res) => {
  try {
    const { hotelId } = req.query;
    

    // Check if hotel exists
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found.", status: false });
    }

    // Fetch reviews for the given hotel
    const reviews = await RatingReview.find({ hotel: hotelId })
      .populate("user", "name profileImage")
      .sort({ createdAt: -1 });

    res.status(200).json({ message: "Reviews fetched successfully!", reviews, status: true });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Server error", error: error.message, status: false });
  }
};

export const bookHotel = async (req, res) => {
  try {
    const { hotelId, checkInDate, checkOutDate, room } = req.body;
    const userId = req.user.id;

    if (!hotelId || !checkInDate || !checkOutDate || !room) {
      return res.status(400).json({ message: "All fields are required", status: false });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found", status: false });
    }

    // Convert dates to proper format
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const today = new Date();

    // Validate check-in and check-out dates
    if (checkIn < today) {
      return res.status(400).json({ message: "Check-in date must be in the future.", status: false });
    }
    
    if (checkOut <= checkIn) {
      return res.status(400).json({ message: "Check-out date must be after check-in date.", status: false });
    }

    // Restrict advance bookings beyond 6 months
    const maxAdvanceDate = new Date();
    maxAdvanceDate.setDate(maxAdvanceDate.getDate() + MAX_ADVANCE_BOOKING_DAYS);
    if (checkIn > maxAdvanceDate) {
      return res.status(400).json({ message: "Bookings cannot be made more than 6 months in advance.", status: false });
    }

    // Check if the room is already booked during the selected period
    const existingBooking = await Booking.findOne({
      hotel: hotelId,
      room,
      $or: [
        { checkInDate: { $lt: checkOut }, checkOutDate: { $gt: checkIn } } // Overlapping booking
      ],
    });

    if (existingBooking) {
      return res.status(400).json({ message: "Selected room is already booked for these dates.", status: false });
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
    res.status(201).json({ message: "Booking successful!", booking: newBooking, status: true });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getBookingByUserId = async (req, res) => {
  try {
    const userId = req.user.id;

    const bookings = await Booking.find({ user: userId }).populate("hotel");

    if (!bookings.length) {
      return res.status(404).json({ message: "No bookings found", status: false });
    }

    res.status(200).json({ message: "Bookings retrieved successfully", bookings, status: true });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId, status } = req.body;

    // Validate required fields
    if (!bookingId || !status) {
      return res.status(400).json({ message: "Booking ID and status are required", status: false });
    }

    // Validate status value
    const validStatuses = ["pending", "confirmed", "cancelled", "upcoming"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value", status: false });
    }

    // Find and update the booking
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { status },
      { new: true }
    );

    if (!updatedBooking) {
      return res.status(404).json({ message: "Booking not found", status: false });
    }

    res.status(200).json({ message: "Booking status updated successfully", booking: updatedBooking, status: true });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getBookingByUser = async (req, res) => {
  try {
    const {userId} = req.query;

    const bookings = await Booking.find({ user: userId }).populate("hotel");

    if (!bookings.length) {
      return res.status(404).json({ message: "No bookings found", status: false });
    }

    res.status(200).json({ message: "Bookings retrieved successfully", bookings, status: true });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find();

    if (!hotels.length) {
      return res.status(404).json({ message: "No hotels found", status: false });
    }

    res.status(200).json({ message: "Hotels retrieved successfully", status: true, hotels });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


