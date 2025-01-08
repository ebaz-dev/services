import express, { Request, Response } from "express";
import { body } from "express-validator";
import {
  validateRequest,
  BadRequestError,
  recognizePhoneNumber,
  User,
  generateConfirmationCode,
  EXPIRATION_CONFIRMATION_SECONDS,
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import { UserCreatedCreatedPublisher } from "../events/publisher/user-created-publisher";
import { natsWrapper } from "../nats-wrapper";

const router = express.Router();

router.post(
  "/signUp",
  [
    body("email").optional().isEmail().withMessage("Email must be valid"),
    body("phoneNumber")
      .optional()
      .isLength({ min: 8, max: 8 })
      .custom((value) => {
        const recognized = recognizePhoneNumber(value);
        return recognized.found;
      })
      .withMessage("Phone number must be valid"),
    body("password").trim().isLength({ min: 3, max: 20 }),
    body()
      .custom((value) => {
        if (!value.email && !value.phoneNumber) {
          return false;
        }
        return true;
      })
      .withMessage("Either email or phone number is required"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { email, password, phoneNumber } = req.body;

    let existingUser;

    if (email) {
      existingUser = await User.findOne({ email, isEmailConfirmed: true });
    } else if (phoneNumber) {
      existingUser = await User.findOne({
        phoneNumber,
        isPhoneConfirmed: true,
      });
    }

    if (existingUser) {
      throw new BadRequestError("User already exist");
    }

    const expiration = new Date();
    expiration.setSeconds(
      expiration.getSeconds() + EXPIRATION_CONFIRMATION_SECONDS
    );

    // Find unconfirmed user if try to register before
    existingUser = await User.findOne({ email, phoneNumber });

    const user = existingUser ? existingUser : new User({ email, phoneNumber });

    // const isExpired = IsExpired(user.confirmationCodeExpiresAt)
    // if(user.confirmationCodeExpiresAt && isExpired.expired){
    //     return new BadRequestError('Its not expired')
    // }

    const confirmationCode = generateConfirmationCode();
    user.confirmationCode = confirmationCode;
    user.password = password;
    user.confirmationCodeExpiresAt = expiration;

    await user.save();

    // Publish user created event
    await new UserCreatedCreatedPublisher(natsWrapper.client).publish({
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      confirmationCode,
      confirmationExpireAt: user.confirmationCodeExpiresAt.toISOString(),
    });

    res
      .status(StatusCodes.CREATED)
      .send(process.env.NODE_ENV === "test" ? user : null);
  }
);

export { router as signUpRouter };
