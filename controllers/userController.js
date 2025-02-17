import User from "../models/User.js";
import Policy from "../models/Policy.js";
import Hotel from "../models/Hotel.js";
import path from "path";
import fs from 'fs';
import { fileURLToPath } from 'url';

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