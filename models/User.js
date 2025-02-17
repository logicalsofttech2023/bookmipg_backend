import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, unique: true, default: "" },
    phone: { type: Number, required: true, unique: true },
    countryCode: { type: Number, required: true, },
    profileImage: { type: String, default: "" },
    otp: { type: String },
    otpExpiresAt: { type: Date },
    isVerified: { type: Boolean, default: false },
    role: { type: String, enum: ["vendor", "admin", "user"], default: "user" },
    dob: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"] },
    maritalStatus: {
      type: String,
      enum: ["single", "married", "divorced", "widowed"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
