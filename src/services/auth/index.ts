import { Admin } from "@prisma/client";
import prisma from "../db/client";
import crud from "../db/crud";
import { sendAuthConfirmationEmail, sendOTPEmail } from "../email/mailer";
import bcrypt from "bcrypt";
import { ServerError } from "../server-error";
import { decrypt, encrypt } from "@/lib/crypto";

export type AuthVerificationInfo = { rememberMe: boolean; verified: boolean };
export type CreateAuthOptions = { expires: Date; secret: string; rememberMe: boolean; ua: UAParser.IResult };

export abstract class AuthService {
  static createSecret(otp: string, session: string, admin: string) {
    return `otp=${otp};admin=${admin};session=${session}`;
  }

  static parseSecret(secret: string) {
    const isValid = (secret: string) => secret.includes("otp=") && secret.includes(";session=") && secret.includes(";admin=");
    if (!isValid(secret)) {
      const decrypted = decrypt(secret) || "";
      if (isValid(decrypted)) {
        secret = decrypted;
      } else return null;
    }
    const [otpPart, idPart, sessionPart] = secret.split(";");
    const otp = otpPart.replace("otp=", "");
    const session = sessionPart.replace("session=", "");
    const adminId = idPart.replace("admin=", "");
    return { otp, session, adminId };
  }

  static async createConfirmation(
    admin: Admin,
    { expires, secret, rememberMe, ua }: { expires: Date; secret: string; rememberMe: boolean; ua: UAParser.IResult }
  ) {
    await crud.createOne(prisma.verification, {
      expires,
      secret,
      type: "CONFIRMATION_AUTH",
      info: JSON.stringify({ rememberMe, verified: false } satisfies AuthVerificationInfo),
    });
    await sendAuthConfirmationEmail(admin.email, encrypt(secret), admin.name, {
      device: ua.device.vendor || ua.browser.name,
      time: new Date().toTimeString(),
    });
  }

  static async createOtp(admin: Admin, { expires, secret, rememberMe, ua }: CreateAuthOptions) {
    const parsed = this.parseSecret(secret);
    if (!parsed) throw new ServerError("CLIENT_TYPE", { field: "secret" });
    const { otp } = parsed;
    await crud.createOne(prisma.verification, {
      expires,
      secret,
      type: "OTP_AUTH",
      info: JSON.stringify({ rememberMe, verified: false } satisfies AuthVerificationInfo),
    });
    await sendOTPEmail(admin.email, otp, admin.name, {
      device: ua.device.vendor || ua.browser.name,
      time: new Date().toTimeString(),
    });
  }

  static hashPassword(password: string) {
    return bcrypt.hash(password.trim(), 10);
  }

  static authStrategy(admin: Admin, { expires, secret, rememberMe, ua }: CreateAuthOptions) {
    const strategy = {
      CONFIRMATION: () => AuthService.createConfirmation(admin, { expires, rememberMe, secret, ua }),
      OTP: () => AuthService.createOtp(admin, { expires, rememberMe, secret, ua }),
    };
    return strategy[admin.auth]();
  }
}
