import express from "express";
import {
  addReview,
  getReviewsByHotelId,
  bookHotel,
  getBookingByUserId,
  updateBookingStatus,
  getBookingByUser,
  getAllHotelsForApp,
  getAllHotelsForWeb,
  getHotelById,
  getAllHotelsByFilter,
  addFavorite,
  removeFavorite,
  getFavorites,
  updateHotelOwnerPolicy,
  getHotelOwnerPolicyByOwnerId,
  getSimilarHotels,
  getHotelOwnerPolicyById
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

router.get("/getAllHotels",authMiddleware, getAllHotelsForApp);

router.get("/getAllHotelsForWeb", getAllHotelsForWeb);

router.get("/getHotelById", getHotelById);

router.get("/getAllHotelsByFilter", getAllHotelsByFilter);

router.post("/updateHotelOwnerPolicy",authMiddleware, updateHotelOwnerPolicy);

router.get("/getHotelOwnerPolicyByOwnerId",authMiddleware, getHotelOwnerPolicyByOwnerId);

router.get("/getSimilarHotels",authMiddleware, getSimilarHotels);

router.get("/getHotelOwnerPolicyById", getHotelOwnerPolicyById);



export default router;
