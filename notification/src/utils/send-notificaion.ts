import { Notification } from "@ezdev/core";
import * as admin from "firebase-admin";
import { UserDevice } from "@ebazdev/auth";

export const sendNotifcation = async (payload: any) => {
  const notification = await Notification.create({
    userId: payload.userId,
    title: payload.notification.title,
    body: payload.notification.body,
  });
  const devices = await UserDevice.find({
    userId: payload.userId,
    deviceToken: { $exists: true },
  });
  const tokens: any = devices.map((device) => {
    return device.deviceToken;
  });

  if (tokens.length > 0) {
    const result = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: payload.notification,
      webpush: {
        notification: {
          title: payload.notification.title,
          body: payload.notification.body,
          data: payload.data,
          requireInteraction: false,
        },
        fcmOptions: {
          link: payload.link,
        },
      },
    });
    console.log("res", result);
  }

  return notification;
};
