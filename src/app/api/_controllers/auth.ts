import { timeInMs } from "@/lib/manipulate/number";
import prisma from "@/services/db/client";
import crud from "@/services/db/crud";
import { generateOTP, sendAuthConfirmationEmail, sendOTPEmail } from "@/services/email/mailer";
import { ServerError } from "@/services/server-error";
import { ApiRequest, ApiResponse } from "@/types/server";
import { Admin } from "@prisma/client";
import bcrypt from "bcrypt";

export type SigninPayload = Pick<Admin, "email" | "password"> & { rememberMe: boolean };
export type SignupPayload = Pick<Admin, "email" | "password" | "name"> & { rememberMe: boolean };
export type SigninResponse = { type: "CONFIRMATION" | "OTP"; session: string };

export abstract class AuthController {
  static neededBodySignin = ["email", "password", "rememberMe"];
  static neededBodySignup = ["email", "password", "rememberMe", "name"];

  static async signin(req: ApiRequest<SigninPayload, never, never>, { reply }: ApiResponse<SigninResponse>) {
    const { email, password, rememberMe } = req.body;

    const admin = await crud.getOne(prisma.admin, { email }, { error: null });
    if (!admin || !admin.password) {
      throw new ServerError("CLIENT_FIELD", { field: "email", message: "Email not registered" });
    }

    const passwordValid = await bcrypt.compare(password.trim(), admin.password);
    if (!passwordValid) {
      throw new ServerError("CLIENT_FIELD", { field: "password", message: "Incorrect Password" });
    }

    const otp = generateOTP();
    const session = crypto.randomUUID();
    const expires = new Date(Date.now() + timeInMs({ minute: 10 }));
    const secret = `otp=${otp}_session=${session}_rememberMe=${String(rememberMe)}`;

    switch (admin.auth) {
      case "CONFIRMATION":
        await crud.createOne(prisma.verification, {
          expires,
          secret,
          type: "CONFIRMATION_AUTH",
        });
        await sendAuthConfirmationEmail(admin.email, secret, admin.name);
        reply.success({ type: "CONFIRMATION", session }).respond();
        break;
      case "OTP":
        await crud.createOne(prisma.verification, {
          expires,
          secret,
          type: "OTP_AUTH",
        });
        await sendOTPEmail(admin.email, otp, admin.name);
        reply.success({ type: "OTP", session }).respond();
        break;
    }
  }

  static async signup(req: ApiRequest<SignupPayload, never, never>, { reply }: ApiResponse<Admin>) {
    const { email, name, password, rememberMe } = req.body;
    const profile = await crud.getOne(
      prisma.profile,
      {},
      {
        error: {
          notFound: new ServerError("CONFLICT", {
            message: "Can not create admin right now",
            details: "Profile is not created yet, please create profile first",
          }),
        },
      }
    );

    const pw = await bcrypt.hash(password, 10);
    const admin = await crud.createOne(prisma.admin, { email, name, password: pw, profileId: profile.id });

    reply.success(admin).setCookie({ template: "REFRESH_ACCESS", rememberMe }).respond();
  }
}
