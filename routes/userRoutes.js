import express from "express";
import {
  addReview,
  getReviewsByHotelId,
  bookHotel,
  getBookingByUserId,
  updateBookingStatus,
  getBookingByUser,
  getAllHotels
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

router.get(
  "/getReviewsByHotelId",
  authMiddleware,
  getReviewsByHotelId
);

router.post(
  "/bookHotel",
  authMiddleware,
  bookHotel
);

router.get(
  "/getBookingByUserId",
  authMiddleware,
  getBookingByUserId
);

router.post(
  "/updateBookingStatus",
  authMiddleware,
  updateBookingStatus
);

router.get(
  "/getBookingByUser",
  authMiddleware,
  getBookingByUser
);

router.get(
  "/getAllHotels",
  authMiddleware,
  getAllHotels
);

export default router;
