import admin from "firebase-admin";

export const sendNotification = async (token, title, body) => {
  
    const message = {
      token,
      notification: {
        title,
        body,
      },
    };
  
    try {
      const response = await admin.messaging().send(message);
      console.log("Notification sent:", response);
      return response;
    } catch (error) {
      console.error("Error sending notification:", error);
      throw error;
    }
};
  