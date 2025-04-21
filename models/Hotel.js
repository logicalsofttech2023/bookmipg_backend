import mongoose from "mongoose";

const hotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    zipCode: { type: String, required: true },
    pricePerNight: { type: Number, required: true },
    originalPricePerNight: { type: Number, required: true },
    taxesAmount: { type: Number },
    rating: { type: Number, default: 0 },
    room: { type: Number, default: 0, required: true },
    description: { type: String },
    amenities: [{ type: String }],
    facilities: [{ type: String }],
    images: [{ type: String }],
    isAvailable: { type: Boolean, default: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    adminVerify: { type: Boolean, default: false },
    roomTypes: [
      {
        type: {
          type: String,
          enum: ["Deluxe", "Classic"],
        },
        typeAmenities: [{ type: String }],
        size: { type: String },
        bedType: { type: String },
        capacity: { type: Number },
        price: { type: Number },
        originalPrice: { type: Number },
        description: { type: String },
        smokingAllowed: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Hotel", hotelSchema);
