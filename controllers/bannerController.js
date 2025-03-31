import Banner from "../models/banner.js";

export const addOrUpdateBanner = async (req, res) => {
  try {
    const imageUrl = req.file ? req.file.path : "";
    let banner = await Banner.findOne();

    if (banner) {
      banner.imageUrl = imageUrl;
      await banner.save();
      return res
        .status(200)
        .json({
          success: true,
          message: "Banner updated successfully",
          banner,
        });
    } else {
      // Create new banner
      banner = new Banner({ imageUrl });
      await banner.save();
      return res
        .status(201)
        .json({
          success: true,
          message: "Banner created successfully",
          banner,
        });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};
