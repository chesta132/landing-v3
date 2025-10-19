import { timeInMs } from "@/lib/manipulate/number";
import { AuthService, AuthVerificationInfo } from "@/services/auth";
import prisma from "@/services/db/client";
import crud from "@/services/db/crud";
import { generateOTP } from "@/services/email/mailer";
import { ServerError } from "@/services/server-error";
import { ApiRequest, ApiResponse } from "@/types/server";
import { $Enums, Admin } from "@prisma/client";
import bcrypt from "bcrypt";
import { UAParser } from "ua-parser-js";

export type SigninPayload = Pick<Admin, "email" | "password"> & { rememberMe: boolean };
export type SignupPayload = Pick<Admin, "email" | "password" | "name"> & { rememberMe: boolean };
export type SigninResponse = { type: $Enums.AdminAuth; session: string };
export type ConfirmSigninOtpPayload = { otp: string; session: string };

export abstract class AuthController {
  static neededBodySignin = ["email", "password", "rememberMe"];
  static neededBodySignup = ["email", "password", "rememberMe", "name"];

  static async signin(req: ApiRequest<SigninPayload, never, never>, { reply }: ApiResponse<SigninResponse>) {
    const { email, password, rememberMe } = req.body;
    const ua = new UAParser(req.headers["user-agent"]).getResult();

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
    const secret = AuthService.createSecret(otp, session, admin);

    await AuthService.authStrategy(admin, { expires, rememberMe, secret, ua });
    reply.success({ type: admin.auth, session }).respond();
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

    const pw = await AuthService.hashPassword(password);
    const admin = await crud.createOne(prisma.admin, { email, name, password: pw, profileId: profile.id });
    reply.success(admin).setCookie({ template: "REFRESH_ACCESS", rememberMe }).respond();
  }

  static async confirmSignin(req: ApiRequest<never, never, "secret">, { reply }: ApiResponse<undefined>) {
    const secret = req.query.secret as string;
    const parsed = AuthService.parseSecret(secret);
    if (!parsed) {
      throw new ServerError("CLIENT_TYPE", { field: "secret" });
    }
    const verif = await crud.getOne(
      prisma.verification,
      { type: "CONFIRMATION_AUTH", secret },
      { error: { notFound: new ServerError("INVALID_VERIF_TOKEN") } }
    );
    const info = JSON.parse(verif.info) as AuthVerificationInfo;
    info.verified = true;
    await crud.updateById(prisma.verification, verif.id, { info: JSON.stringify(info), expires: new Date(Date.now() + timeInMs({ minute: 15 })) });
    reply.success(undefined).respond();
  }

  static async confirmSigninOtp(req: ApiRequest<ConfirmSigninOtpPayload, never, never>, { reply }: ApiResponse<Admin>) {
    const { otp, session } = req.body;
    const secret = AuthService.createMiniSecret(otp, session);

    const verif = await crud.getOne(
      prisma.verification,
      { type: "OTP_AUTH", secret: { startsWith: secret } },
      { error: { notFound: new ServerError("INVALID_OTP") } }
    );
    const { rememberMe } = JSON.parse(verif.info) as AuthVerificationInfo;
    await crud.deleteById(prisma.verification, verif.id);

    const parsed = AuthService.parseSecret(verif.secret);
    if (!parsed) throw new ServerError("CLIENT_TYPE", { field: "secret" });
    const { adminId } = parsed;
    const admin = await crud.getById(prisma.admin, adminId);
    reply.success(admin).setCookie({ template: "REFRESH_ACCESS", rememberMe }).respond();
  }

  static async signinByConfirm(req: ApiRequest<never, never, "session">, { reply }: ApiResponse<Admin>) {
    const session = req.query.session as string;

    const verif = await crud.getOne(
      prisma.verification,
      { secret: { endsWith: session }, type: "CONFIRMATION_AUTH" },
      { error: { notFound: new ServerError("INVALID_VERIF_TOKEN") } }
    );
    const { rememberMe, verified } = JSON.parse(verif.info) as AuthVerificationInfo;
    if (!verified) {
      throw new ServerError("INVALID_VERIF_TOKEN");
    }
    await crud.deleteById(prisma.verification, verif.id);

    const { adminId } = AuthService.parseSecret(verif.secret)!;

    const admin = await crud.getById(prisma.admin, adminId);
    reply.success(admin).setCookie({ template: "REFRESH_ACCESS", rememberMe }).respond();
  }
}
