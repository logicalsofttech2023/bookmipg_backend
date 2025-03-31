import mongoose from "mongoose";

const hotelOwnerPolicySchema = new mongoose.Schema(
  {
    hotelOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    type: {
      type: String,
      enum: ["house", "cancellation", "rules"],
      required: true,
    },
    content: {
      type: [String],
      required: true,
    },
    checkInTime: {
      type: String,
      default: null,
    },
    checkOutTime: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("hotelOwnerPolicy", hotelOwnerPolicySchema);
