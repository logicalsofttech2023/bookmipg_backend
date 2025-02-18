import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String },
    phone: { type: String, required: true },
    countryCode: { type: String, required: true },
    profileImage: { type: String, default: null },
    otp: { type: String },
    otpExpiresAt: { type: Date },
    isVerified: { type: Boolean, default: false },
    role: { type: String, enum: ["vendor", "admin", "user"], default: "user" },
    dob: { type: Date },
    gender: { type: String, enum: ["Male", "Female", "Undisclosed"] },
    maritalStatus: {
      type: String,
      enum: ["Married", "Unmarried", "Undisclosed"],
    },
    firebaseToken: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
