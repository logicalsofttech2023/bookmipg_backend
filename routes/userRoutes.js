import express from "express";
import {
  addReview,
  getReviewsByHotelId,
} from "../controllers/userController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { uploadRating } from "../middlewares/uploadMiddleware.js";
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

export default router;
