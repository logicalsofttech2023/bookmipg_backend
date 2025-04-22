import express from "express";
import {
  getAllUsers,
  policyUpdate,
  getPolicy,
  addHotel,
  getAllOwners,
  updateHotel,
  getByHotelId,
  getHotelsByOwnerId,
  deleteHotel,
  deleteHotelImage,
  createCoupon,
  assignCouponToUsers,
  loginAdmin,
  getUserByIdInAdmin,
  getBookingByUserIdInAdmin,
  getReviewsByUserIdInAdmin,
  getAllReviewsInAdmin,
  verifyUserByAdmin,
  getAllBookingByOwnerId,
  getAllReviewByOwnerId,
  getAllHotelsByInAdmin,
  getAllVendors,
  verifyHotelByAdmin,
  getAllBookingsInAdmin,
  getContacts,
  addOrUpdateContact,
  updateCoupon,
  deleteCoupon,
  getAllCoupons,
  getCouponById,
  getAllCustomer,
  getUsersAssignedToCoupon,
  dashboardData,
  getAdminDetail,
  resetAdminPassword,
  updateAdminDetail,
  adminSignup,
  verifyHotelByOwner,
  getHotelOwnerPolicyByOwnerId,
  updateHotelOwnerPolicy,
  updateCheckInCheckOutTimes,
  getHotelsByOwnerIdInAdmin
} from "../controllers/adminController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { uploadHotel } from "../middlewares/uploadMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { addOrUpdateBanner } from "../controllers/bannerController.js";

const router = express.Router();

router.post("/loginAdmin", loginAdmin);

router.get(
  "/getAllOwners",
  authMiddleware,

  getAllOwners
);

router.get(
  "/getAllUsers",
  authMiddleware,

  getAllUsers
);

router.post(
  "/policyUpdate",
  authMiddleware,

  policyUpdate
);

router.get("/getPolicy", authMiddleware, getPolicy);

router.post(
  "/addHotel",
  authMiddleware,
  uploadHotel.array("images", 20),
  addHotel
);

router.post(
  "/updateHotel",
  authMiddleware,
  uploadHotel.array("images", 20),
  updateHotel
);

router.get("/getByHotelId", authMiddleware, getByHotelId);

router.get("/getHotelsByOwnerId", authMiddleware, getHotelsByOwnerId);

router.post("/deleteHotel", authMiddleware, deleteHotel);

router.post("/deleteHotelImage", authMiddleware, deleteHotelImage);

router.post("/createCoupon", authMiddleware, createCoupon);

router.post("/assignCouponToUsers", authMiddleware, assignCouponToUsers);

router.get("/getUserByIdInAdmin", authMiddleware, getUserByIdInAdmin);

router.get(
  "/getBookingByUserIdInAdmin",
  authMiddleware,
  getBookingByUserIdInAdmin
);

router.get(
  "/getReviewsByUserIdInAdmin",
  authMiddleware,
  getReviewsByUserIdInAdmin
);

router.get("/getAllReviewsInAdmin", authMiddleware, getAllReviewsInAdmin);

router.post("/verifyUserByAdmin", authMiddleware, verifyUserByAdmin);

router.get("/getAllBookingByOwnerId", authMiddleware, getAllBookingByOwnerId);

router.get("/getAllReviewByOwnerId", authMiddleware, getAllReviewByOwnerId);

router.get("/getAllHotelsByInAdmin", authMiddleware, getAllHotelsByInAdmin);

router.get("/getAllVendors", authMiddleware, getAllVendors);

router.post("/verifyHotelByAdmin", authMiddleware, verifyHotelByAdmin);

router.get("/getAllBookingsInAdmin", authMiddleware, getAllBookingsInAdmin);

router.post("/addOrUpdateBanner", authMiddleware, addOrUpdateBanner);

router.post("/addOrUpdateContact", authMiddleware, addOrUpdateContact);

router.get("/getContacts", authMiddleware, getContacts);

router.post("/updateCoupon", authMiddleware, updateCoupon);

router.post("/deleteCoupon", authMiddleware, deleteCoupon);

router.get("/getAllCoupons", authMiddleware, getAllCoupons);

router.get("/getCouponById", authMiddleware, getCouponById);

router.get("/getAllCustomer", authMiddleware, getAllCustomer);

router.get("/getUsersAssignedToCoupon", authMiddleware, getUsersAssignedToCoupon);

router.get("/dashboardData", authMiddleware, dashboardData);

router.get("/getAdminDetail", authMiddleware, getAdminDetail);

router.post("/resetAdminPassword", authMiddleware, resetAdminPassword);

router.post("/updateAdminDetail", authMiddleware, updateAdminDetail);

router.post("/adminSignup", adminSignup);

router.post("/verifyHotelByOwner", authMiddleware, verifyHotelByOwner);

router.get("/getHotelOwnerPolicyByOwnerId", authMiddleware, getHotelOwnerPolicyByOwnerId);


router.post("/updateHotelOwnerPolicy", authMiddleware, updateHotelOwnerPolicy);


router.post("/updateCheckInCheckOutTimes", authMiddleware, updateCheckInCheckOutTimes);

router.get("/getHotelsByOwnerIdInAdmin", authMiddleware, getHotelsByOwnerIdInAdmin);


export default router;
