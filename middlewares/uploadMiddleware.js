import multer from "multer";
import path from "path";

// Storage configuration for profile images
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/profile/"); // Profile image path
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// Storage configuration for hotel images
const hotelStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/hotel/"); // Hotel image path
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// File filter for only images
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        return cb(new Error("Only images (jpg, jpeg, png) are allowed!"), false);
    }
};

// Profile image upload
export const uploadProfile = multer({ 
    storage: profileStorage, 
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

// Hotel image upload (multiple images allowed)
export const uploadHotel = multer({ 
    storage: hotelStorage, 
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});
