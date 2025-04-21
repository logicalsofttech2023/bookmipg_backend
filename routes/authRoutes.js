import express from "express";
import { generateOtp, verifyOtp, resendOtp, completeRegistration, updateProfile, getUserById, VendorLogin } from "../controllers/authController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { uploadProfile  } from "../middlewares/uploadMiddleware.js";


const router = express.Router();

router.post("/generateOtp", generateOtp);
router.post("/verifyOtp", verifyOtp);
router.post("/resendOtp", resendOtp);
router.post("/completeRegistration", uploadProfile.single("profileImage"), completeRegistration);
router.post("/updateProfile", authMiddleware, uploadProfile.single("profileImage"), updateProfile);
router.get("/getUserById",authMiddleware, getUserById);
router.post("/vendorLogin", VendorLogin);

export default router;
