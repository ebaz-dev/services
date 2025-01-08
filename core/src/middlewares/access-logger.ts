import mongoose from "../lib/mongoose";
import { Request, Response, NextFunction } from "express";
import { AccessLog } from "../models/access-log";

export const accessLogger = (serviceName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip logging for any health check endpoints
    if (req.path.endsWith("/health")) {
      return next();
    }

    const startTime = Date.now();

    // Store original functions
    const originalEnd = res.end;
    const originalJson = res.json;
    const originalSend = res.send;
    let responseBody: any;

    // Get full path including base URL
    const fullPath = req.originalUrl || req.url;

    // Override json function to capture JSON response
    res.json = function (body: any) {
      responseBody = body;
      return originalJson.call(this, body);
    };

    // Override send function to capture other response types
    res.send = function (body: any) {
      if (!responseBody) {
        if (typeof body === "object") {
          responseBody = body;
        } else {
          responseBody = {
            content: typeof body === "string" ? body : "Binary content",
            contentType: res.get("Content-Type") || "unknown",
          };
        }
      }
      return originalSend.call(this, body);
    };

    // Override end function
    res.end = function (chunk?: any, encoding?: any, cb?: any) {
      const responseTime = Date.now() - startTime;

      if (!responseBody && chunk) {
        const contentType = res.get("Content-Type");
        responseBody = {
          content: "Binary or stream content",
          contentType,
          size: Buffer.byteLength(chunk, encoding as BufferEncoding),
        };
      }

      // Get deviceId from currentUser instead of headers
      const deviceId = req.currentUser?.deviceId;

      // Update user device independently
      if (req.currentUser?.id && deviceId && mongoose.connection.db) {
        mongoose.connection.db
          .collection("userdevices")
          .updateOne(
            {
              userId: new mongoose.Types.ObjectId(req.currentUser.id),
              _id: new mongoose.Types.ObjectId(deviceId),
            },
            { $set: { lastActiveTime: new Date() } },
            { upsert: true }
          )
          .catch((err) => console.error("Failed to update user device:", err));
      }

      // Save access log independently
      AccessLog.build({
        timestamp: new Date(),
        method: req.method,
        path: fullPath,
        userId: req.currentUser?.id,
        deviceId: deviceId, // Use deviceId from currentUser
        statusCode: res.statusCode,
        responseTime,
        userAgent: req.get("user-agent") || "unknown",
        ip: req.ip || req.socket.remoteAddress || "unknown",
        service: serviceName,
        responseBody,
        errorMessage:
          res.statusCode >= 400
            ? responseBody?.errors?.[0]?.message
            : undefined,
        errorStack:
          res.statusCode >= 500 ? responseBody?.errors?.[0]?.stack : undefined,
      })
        .save()
        .catch((err) => console.error("Failed to save access log:", err));

      return originalEnd.call(this, chunk, encoding, cb);
    };

    next();
  };
};
