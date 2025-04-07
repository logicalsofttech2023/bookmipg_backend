import Notification from "../models/Notification.js";

export const addNotification = async (userId, title, body) => {
  try {
    const notification = new Notification({
      userId,
      title,
      body,
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error saving notification:", error);
    throw error;
  }
};
