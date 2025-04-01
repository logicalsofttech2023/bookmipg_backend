import express from "express";
import {
  addReview,
  getReviewsByHotelId,
  bookHotel,
  getBookingByUserId,
  updateBookingStatus,
  getBookingByOwnerId,
  getAllHotelsForApp,
  getAllHotelsForWeb,
  getHotelById,
  getAllHotelsByFilter,
  addFavorite,
  removeFavorite,
  getFavorites,
  getHotelOwnerPolicyByOwnerId,
  getSimilarHotels,
  getHotelOwnerPolicyById,
  getNearbyHotels,
  getRecommendedHotelsForWeb,
  getTrendingHotels,
  getUserCoupons,
  applyUserCoupon,
  cancelBooking,
  getBookingById,
  getHotelByIdForWeb,
  searchHotels,
} from "../controllers/userController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import optionalMiddleware from "../middlewares/optionalMiddleware.js";
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

router.get("/getBookingByOwnerId", authMiddleware, getBookingByOwnerId);

router.post("/addFavorite", authMiddleware, addFavorite);

router.post("/removeFavorite", authMiddleware, removeFavorite);

router.get("/getFavorites", authMiddleware, getFavorites);

router.get("/getAllHotels", authMiddleware, getAllHotelsForApp);

router.get("/getAllHotelsForWeb", optionalMiddleware, getAllHotelsForWeb);

router.get("/getHotelById", authMiddleware, getHotelById);

router.get("/getHotelByIdForWeb", optionalMiddleware, getHotelByIdForWeb);

router.get("/getAllHotelsByFilter", optionalMiddleware, getAllHotelsByFilter);

router.get(
  "/getHotelOwnerPolicyByOwnerId",
  authMiddleware,
  getHotelOwnerPolicyByOwnerId
);

router.get("/getSimilarHotels", authMiddleware, getSimilarHotels);

router.get("/getHotelOwnerPolicyById", getHotelOwnerPolicyById);

router.post("/getNearbyHotels", getNearbyHotels);

router.post(
  "/getRecommendedHotels",
  authMiddleware,
  getRecommendedHotelsForWeb
);

router.get("/getTrendingHotels", getTrendingHotels);

router.get("/getUserCoupons", authMiddleware, getUserCoupons);

router.post("/applyUserCoupon", authMiddleware, applyUserCoupon);

router.post("/cancelBooking", authMiddleware, cancelBooking);

router.get("/getBookingById", getBookingById);

router.get("/searchHotels", authMiddleware, searchHotels);

export default router;
