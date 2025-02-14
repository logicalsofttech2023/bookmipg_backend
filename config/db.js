import mongoose from "mongoose";

const connectDB = () => {
  // MongoDB Connection
  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.error("DB Connection Failed:", err));
};

export default connectDB;
