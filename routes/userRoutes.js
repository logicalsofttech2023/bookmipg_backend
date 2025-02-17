import express from "express";
import { addReview } from "../controllers/userController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { uploadProfile } from "../middlewares/uploadMiddleware.js";
const router = express.Router();

router.get("/addReview", authMiddleware, addReview);

export default router;
