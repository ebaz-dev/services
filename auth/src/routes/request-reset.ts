import express, { Request, Response } from "express";
import { User } from "../shared/models/user";
import { BadRequestError } from "@ezdev/core";
import { SendSMSPublisher } from "../events/publisher/send-sms-publisher";
import { natsWrapper } from "../nats-wrapper";
import { generateConfirmationCode } from "../shared/utils/generate-confirmation-code";
import { EXPIRATION_CONFIRMATION_SECONDS } from "../shared/utils/constants";

const router = express.Router();

router.post(`/request-reset`, async (req: Request, res: Response) => {
  const { email, phoneNumber } = req.body;

  // User must provide either email or phone
  if (!email && !phoneNumber) {
    throw new BadRequestError("Email or phone number must be provided");
  }

  // Find user by email or phone
  const user = await User.findOne(email ? { email } : { phoneNumber });

  if (!user) {
    throw new BadRequestError("User not found");
  }

  // Generate confirmation code using utility function
  const confirmationCode = generateConfirmationCode();
  const expiration = new Date();
  expiration.setSeconds(
    expiration.getSeconds() + EXPIRATION_CONFIRMATION_SECONDS
  );

  // Save confirmation code to user
  user.confirmationCode = confirmationCode;
  user.confirmationCodeExpiresAt = expiration;
  await user.save();

  // If phone number provided, send SMS
  if (phoneNumber) {
    await new SendSMSPublisher(natsWrapper.client).publish({
      phoneNumber,
      text: `Your confirmation code is: ${confirmationCode} for Ebazaar.mn.`,
    });
  }

  // If email provided, you would send email here
  // TODO: Implement email sending

  res.status(200).send({ message: "Reset code sent successfully" });
});

export { router as requestResetRouter };
