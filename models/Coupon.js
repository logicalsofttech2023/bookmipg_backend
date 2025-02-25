import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    discountPercentage: { type: Number, required: true },
    title: { type: String, required: true },
    expiryDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    assignedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    appliedCouponUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export default mongoose.model("Coupon", couponSchema);
