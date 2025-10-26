import { Admin } from "@prisma/client";
import crud from "../db/crud";
import prisma from "../db/client";
import { AuthService, AuthVerificationInfo, CreateAuthOptions } from ".";
import { decrypt, encrypt } from "@/lib/crypto";
import Email from "../email/mailer";
import { ServerError } from "../server-error";
import bcrypt from "bcrypt";
import { timeInMs } from "@/lib/manipulate/number";

export abstract class SigninService {
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
    await Email.sendAuthConfirmation(admin.email, {
      name: admin.name,
      secret: encrypt(secret),
      type: "SIGN_IN",
      loginInfo: {
        device: ua.device.vendor || ua.browser.name,
        time: new Date().toTimeString(),
      },
    });
  }

  static async createOtp(admin: Admin, { expires, secret, rememberMe, ua }: CreateAuthOptions) {
    const parsed = AuthService.parseSecret(secret);
    if (!parsed) throw new ServerError("CLIENT_TYPE", { field: "secret" });
    const { otp } = parsed;
    await crud.createOne(prisma.verification, {
      expires,
      secret,
      type: "OTP_AUTH",
      info: JSON.stringify({ rememberMe, verified: false } satisfies AuthVerificationInfo),
    });
    await Email.sendOTP(admin.email, {
      otp,
      name: admin.name,
      loginInfo: {
        device: ua.device.vendor || ua.browser.name,
        time: new Date().toTimeString(),
      },
    });
  }

  static async getByEmailWithAuth({ email, password }: { email: string; password: string }) {
    const admin = await crud.getOne(
      prisma.admin,
      { email },
      { error: { notFound: new ServerError("CLIENT_FIELD", { field: "email", message: "Email not registered" }) } }
    );

    const passwordValid = await bcrypt.compare(password.trim(), admin.password);
    if (!passwordValid) {
      throw new ServerError("CLIENT_FIELD", { field: "password", message: "Incorrect Password" });
    }
    return admin;
  }

  static async confirmVerification(encryptedSecret: string) {
    const parsed = AuthService.parseSecret(encryptedSecret);
    if (!parsed) throw new ServerError("CLIENT_TYPE", { field: "secret" });
    const secret = AuthService.createSecret(parsed);

    const verif = await crud.getOne(
      prisma.verification,
      { type: "CONFIRMATION_AUTH", secret },
      { error: { notFound: new ServerError("INVALID_VERIF_TOKEN") } }
    );
    const info = JSON.parse(verif.info) as AuthVerificationInfo;
    info.verified = true;
    const updated = await crud.updateById(prisma.verification, verif.id, {
      info: JSON.stringify(info),
      expires: new Date(Date.now() + timeInMs({ minute: 15 })),
    });
    return updated;
  }

  static async getVerifiedByOtp({ encryptedSession, otp }: { otp: string; encryptedSession: string }) {
    const session = decrypt(encryptedSession) || "";
    const startsWith = `otp=${otp}`;
    const endsWith = `session=${session}`;

    const verif = await crud.getOne(
      prisma.verification,
      { type: "OTP_AUTH", secret: { startsWith, endsWith } },
      { error: { notFound: new ServerError("INVALID_OTP") } }
    );

    const parsed = AuthService.parseSecret(verif.secret);
    if (!parsed) throw new ServerError("INVALID_VERIF_TOKEN");
    return { parsedInfo: JSON.parse(verif.info) as AuthVerificationInfo, verif, parsedSecret: parsed };
  }

  static async getVerifiedByConfirm(encryptedSession: string) {
    const session = decrypt(encryptedSession) || "";

    const verif = await crud.getOne(
      prisma.verification,
      { secret: { endsWith: `session=${session}` }, type: "CONFIRMATION_AUTH" },
      { error: { notFound: new ServerError("INVALID_VERIF_TOKEN") } }
    );
    const parsedInfo = JSON.parse(verif.info) as AuthVerificationInfo;
    const parsedSecret = AuthService.parseSecret(verif.secret);
    if (!parsedInfo.verified || !parsedSecret) throw new ServerError("INVALID_VERIF_TOKEN");

    return { parsedInfo, verif, parsedSecret };
  }
}
