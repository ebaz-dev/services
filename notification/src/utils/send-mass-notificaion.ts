import { Notification, NotificationStatus } from "@ezdev/core";
import * as admin from "firebase-admin";
import { UserDevice } from "@ebazdev/auth";
import { Types } from "mongoose";

interface NotificationPayload {
  tokens: string[];
  title: string;
  body: string;
  data?: any;
  link?: string;
}

const sendNotifcation = (payload: NotificationPayload) => {
  return admin.messaging().sendEachForMulticast({
    tokens: payload.tokens,
    notification: { title: payload.title, body: payload.body },
    webpush: {
      notification: {
        title: payload.title,
        body: payload.body,
        data: payload.data,
        requireInteraction: false,
      },
      fcmOptions: {
        link: payload.link,
      },
    },
  });
};

export const sendMassNotifcation = async ({
  userIds,
  title,
  body,
  data,
  senderName,
  senderId,
  supplierId,
}: {
  userIds: Types.ObjectId[];
  title: string;
  body: string;
  data?: any;
  senderName: string;
  senderId?: Types.ObjectId;
  supplierId: Types.ObjectId;
}) => {
  const notification = await Notification.create({
    title,
    body,
    data,
    senderName,
    senderId,
    supplierId,
    receivers: userIds.map((id) => {
      return { id: new Types.ObjectId(id), status: NotificationStatus.Unread };
    }),
  });

  const devices = await UserDevice.find({
    userId: { $in: userIds },
    isLogged: true,
    deviceToken: { $exists: true },
  });
  const tokens: any = devices.map((device) => {
    return device.deviceToken;
  });

  if (tokens.length > 0) {
    const result = await sendNotifcation({ tokens, title, body, data });
    console.log("res", result);
  }

  return notification;
};
