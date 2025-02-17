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
  deleteHotel
} from "../controllers/adminController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { uploadHotel } from "../middlewares/uploadMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";


const router = express.Router();

router.get(
  "/getAllOwners",
  authMiddleware,
  roleMiddleware(["admin"]),
  getAllOwners
);

router.get(
  "/getAllUsers",
  authMiddleware,
  roleMiddleware(["admin"]),
  getAllUsers
);

router.post(
  "/policyUpdate",
  authMiddleware,
  roleMiddleware(["admin"]),
  policyUpdate
);

router.get("/getPolicy", authMiddleware, roleMiddleware(["admin"]), getPolicy);

router.post("/addHotel", authMiddleware, roleMiddleware(["admin","vendor"]), uploadHotel.array("images", 20), addHotel);

router.post("/updateHotel", authMiddleware, roleMiddleware(["admin","vendor"]), uploadHotel.array("images", 20), updateHotel);

router.get("/getByHotelId", authMiddleware, roleMiddleware(["admin", "vendor"]), getByHotelId);

router.get("/getHotelsByOwnerId", authMiddleware, roleMiddleware(["admin","vendor"]), getHotelsByOwnerId);

router.post("/deleteHotel", authMiddleware, roleMiddleware(["admin"]), deleteHotel);



export default router;
