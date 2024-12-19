import express, { Request, Response } from "express";
import { body } from "express-validator";
import { User } from "../shared/models/user";
import {
  BadRequestError,
  recognizePhoneNumber,
  validateRequest,
} from "@ezdev/core";

const router = express.Router();

router.post(
  `/verify-reset-code`,
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
    body("confirmationCode")
      .notEmpty()
      .withMessage("Confirmation code is required"),
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
    const { email, phoneNumber, confirmationCode } = req.body;

    // Find user by email or phone
    const user = await User.findOne(email ? { email } : { phoneNumber });

    if (!user) {
      throw new BadRequestError("User not found");
    }

    // Verify confirmation code
    if (!user.confirmationCode || !user.confirmationCodeExpiresAt) {
      throw new BadRequestError("No reset was requested");
    }

    if (user.confirmationCode !== confirmationCode) {
      throw new BadRequestError("Invalid confirmation code");
    }

    if (user.confirmationCodeExpiresAt < new Date()) {
      throw new BadRequestError("Confirmation code has expired");
    }

    res.status(200).send({ valid: true });
  }
);

export { router as verifyResetCodeRouter };
