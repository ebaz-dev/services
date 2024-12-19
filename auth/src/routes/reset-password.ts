import express, { Request, Response } from "express";
import { body } from "express-validator";
import { User } from "../shared/models/user";
import { BadRequestError, recognizePhoneNumber } from "@ezdev/core";
import { validateRequest } from "@ezdev/core";

const router = express.Router();

router.post(
  `/reset-password`,
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
    body("password")
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage("Password must be between 3 and 20 characters"),
    validateRequest,
  ],
  async (req: Request, res: Response) => {
    const { email, phoneNumber, confirmationCode, password } = req.body;

    if (!email && !phoneNumber) {
      throw new BadRequestError("Email or phone number must be provided");
    }

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

    // Update password
    user.password = password;
    user.confirmationCode = undefined;
    user.confirmationCodeExpiresAt = undefined;
    await user.save();

    res.status(200).send({ message: "Password reset successfully" });
  }
);

export { router as resetPasswordRouter };
