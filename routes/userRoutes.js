import express from "express";
import {
  addReview,
  getReviewsByHotelId,
  bookHotel,
  getBookingByUserId,
  updateBookingStatus,
  getBookingByUser,
  getAllHotels,
  getHotelById,
  getAllHotelsByFilter,
  addFavorite,
  removeFavorite,
  getFavorites,
} from "../controllers/userController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { uploadRating, uploadHotel } from "../middlewares/uploadMiddleware.js";
const router = express.Router();

router.post(
  "/addReview",
  authMiddleware,
  uploadRating.array("images", 20),
  addReview
);

router.get("/getReviewsByHotelId", getReviewsByHotelId);

router.post("/bookHotel", authMiddleware, bookHotel);

router.get("/getBookingByUserId", authMiddleware, getBookingByUserId);

router.post("/updateBookingStatus", authMiddleware, updateBookingStatus);

router.get("/getBookingByUser", authMiddleware, getBookingByUser);

router.post("/addFavorite", authMiddleware, addFavorite);

router.post("/removeFavorite", authMiddleware, removeFavorite);

router.get("/getFavorites", authMiddleware, getFavorites);

router.get("/getAllHotels", getAllHotels);

router.get("/getHotelById", getHotelById);

router.get("/getAllHotelsByFilter", getAllHotelsByFilter);


export default router;
