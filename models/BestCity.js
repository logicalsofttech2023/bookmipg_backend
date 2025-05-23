import mongoose from "mongoose";

const bestCitySchema = new mongoose.Schema(
  {
    image: { type: String },
    cityName: { type: String, required: true },
    hotelCount: { type: String, default: "0" },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  { timestamps: true }
);

const BestCity = mongoose.model("BestCity", bestCitySchema);

export default BestCity;
