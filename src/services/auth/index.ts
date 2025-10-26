import { Admin } from "@prisma/client";
import prisma from "../db/client";
import crud from "../db/crud";
import bcrypt from "bcrypt";
import { ServerError } from "../server-error";
import { decrypt } from "@/lib/crypto";
import { SigninService } from "./signin";

export type AuthVerificationInfo = { rememberMe: boolean; verified: boolean };
export type CreateAuthOptions = { expires: Date; secret: string; rememberMe: boolean; ua: UAParser.IResult };
export type CreateAdminInfo = Stringified<{
  email: string;
  name: string;
  password: string;
}>;
type SecretPayload = { otp: string; session: string; adminId: string };

export abstract class AuthService {
  static createSecret(data: SecretPayload): string;
  static createSecret(otp: string, session: string, adminId: string): string;
  static createSecret(otp: string | SecretPayload, session?: string, adminId?: string) {
    if (typeof otp !== "string") {
      const data = { ...otp };
      otp = data.otp;
      session = data.session;
      adminId = data.adminId;
    }
    return `otp=${otp};admin=${adminId};session=${session}`;
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

  static hashPassword(password: string) {
    return bcrypt.hash(password.trim(), 10);
  }

  static authStrategy(admin: Admin, { expires, secret, rememberMe, ua }: CreateAuthOptions) {
    const strategy = {
      CONFIRMATION: () => SigninService.createConfirmation(admin, { expires, rememberMe, secret, ua }),
      OTP: () => SigninService.createOtp(admin, { expires, rememberMe, secret, ua }),
    };
    return strategy[admin.auth]();
  }

  static getProfile(action: "SIGN_UP") {
    return crud.getOne(
      prisma.profile,
      {},
      {
        error: {
          notFound: new ServerError("CONFLICT", {
            message: action === "SIGN_UP" ? "Can not create admin right now" : "Can not access profile",
            details: "Profile is not created yet, please create profile first",
          }),
        },
      }
    );
  }
}
