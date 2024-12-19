import express, { Request, Response } from "express";
import { body } from "express-validator";
import {
  validateRequest,
  BadRequestError,
  recognizePhoneNumber,
  NotFoundError,
} from "@ezdev/core";
import { UserDevice, DeviceTypes, User } from "../shared";
import { Password } from "../shared/utils/password";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import { MobileDeviceTypes } from "../shared/types/device-types";
import { v5 as uuidv5 } from "uuid";

const router = express.Router();

// Validation rules for sign in
const validationRules = [
  body("email").optional().isEmail().withMessage("Email must be valid"),
  body("phoneNumber")
    .optional()
    .isLength({ min: 8, max: 8 })
    .custom((value) => recognizePhoneNumber(value).found)
    .withMessage("Phone number must be valid"),
  body("password").trim().notEmpty().withMessage("You must apply password"),
  body()
    .custom((value) => Boolean(value.email || value.phoneNumber))
    .withMessage("Either email or phone number is required"),
  body("deviceToken")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("deviceToken must be valid"),
  body("deviceType")
    .custom((value) => Object.values(DeviceTypes).includes(value))
    .withMessage(
      `deviceType must be one of: ${Object.values(DeviceTypes).join(", ")}`
    ),
  body("deviceName").trim().notEmpty().withMessage("deviceName must be valid"),
  body("deviceFingerprint")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("deviceFingerprint must be valid"),
];

interface SignInResponse {
  user: any;
  deviceInfo?: {
    fingerprint: string;
    deviceType: DeviceTypes;
  };
}

// Generate device identifier based on type and fingerprint
const generateDeviceIdentifier = (
  type: DeviceTypes,
  deviceName: string,
  fingerprint?: string
) => {
  // For mobile devices (iOS/Android), require device fingerprint
  // if (MobileDeviceTypes.includes(type)) {
  //   if (!fingerprint) {
  //     throw new BadRequestError(
  //       "Device fingerprint required for mobile devices"
  //     );
  //   }
  //   return fingerprint;
  // }

  // For web/pos, generate if not provided
  // if ([DeviceTypes.Web, DeviceTypes.Pos].includes(type)) {
  return fingerprint || uuidv5(deviceName + Date.now(), uuidv5.URL);
  // }

  throw new BadRequestError("Invalid device type");
};

router.post(
  "/signIn",
  validationRules,
  validateRequest,
  async (req: Request, res: Response) => {
    const {
      email,
      phoneNumber,
      password,
      deviceToken,
      deviceType,
      deviceName,
      deviceFingerprint,
    } = req.body;

    // Find user by email or phone
    const existingUser = await User.findOne(
      email
        ? { email, isEmailConfirmed: true }
        : { phoneNumber, isPhoneConfirmed: true }
    );

    if (!existingUser) {
      throw new NotFoundError();
    }

    const passwordMatch = await Password.compare(
      existingUser.password,
      password
    );
    if (!passwordMatch) {
      throw new BadRequestError("Invalid credentials");
    }

    const deviceIdentifier = generateDeviceIdentifier(
      deviceType,
      deviceName,
      deviceFingerprint
    );

    const existingDevice = await UserDevice.findOneAndUpdate(
      {
        userId: existingUser.id,
        deviceIdentifier,
      },
      {
        $set: {
          deviceToken,
          deviceName,
          deviceType,
          deviceIdentifier,
          isLogged: true,
          lastActiveTime: new Date(),
          logoutTime: null,
        },
      },
      { upsert: true, new: true }
    );

    // Generate JWT
    const userJwt = jwt.sign(
      {
        id: existingUser.id,
        identifier: email || phoneNumber,
        deviceId: existingDevice.id,
      },
      process.env.JWT_KEY!
    );

    req.session = { jwt: userJwt };

    const response: SignInResponse = {
      user: existingUser,
    };

    // Include fingerprint only for web/pos clients
    if ([DeviceTypes.Web, DeviceTypes.Pos].includes(deviceType)) {
      response.deviceInfo = {
        fingerprint: deviceIdentifier,
        deviceType,
      };
    }

    res.status(StatusCodes.OK).send(response);
  }
);

export { router as signInRouter };
