import { decrypt, encrypt } from "@/lib/crypto";
import { timeInMs } from "@/lib/manipulate/number";
import { AuthService, AuthVerificationInfo } from "@/services/auth";
import prisma from "@/services/db/client";
import crud from "@/services/db/crud";
import { generateOTP } from "@/services/email/mailer";
import { ServerError } from "@/services/server-error";
import { ApiRequest, ApiResponse, CreateRouteOptionsBase } from "@/lib/route/types";
import { $Enums, Admin } from "@prisma/client";
import bcrypt from "bcrypt";
import { UAParser } from "ua-parser-js";
import z from "zod";
import { AuthPayload } from "../_payloads/auth";

export type SigninResponse = { type: $Enums.AdminAuth; session: string };

export abstract class AuthController {
  static readonly routeOptions = {
    signin: { bodyValidator: z.object({ email: z.email(), password: z.string(), rememberMe: z.boolean() }).strip() },
    signup: { bodyValidator: z.object({ email: z.email(), password: z.string(), rememberMe: z.boolean(), name: z.string() }).strip() },
    sigininByOtp: { bodyValidator: z.object({ otp: z.string(), session: z.string() }).strip() },
    signinByConfirm: { queryValidator: z.object({ session: z.string() }).strip() },
    confirmSignin: { queryValidator: z.object({ secret: z.string() }).strip() },
  } satisfies Record<string, CreateRouteOptionsBase>;

  static async signin(req: ApiRequest<AuthPayload.SigninBody, never, never>, { reply }: ApiResponse<SigninResponse>) {
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
    const secret = AuthService.createSecret(otp, session, admin.id);

    await AuthService.authStrategy(admin, { expires, rememberMe, secret, ua });
    reply.success({ type: admin.auth, session: encrypt(session) }).respond();
  }

  static async signup(req: ApiRequest<AuthPayload.SignupBody, never, never>, { reply }: ApiResponse<Admin>) {
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
    await crud.getOne(
      prisma.admin,
      { email },
      { error: { found: new ServerError("CLIENT_FIELD", { field: "email", message: "Email already registered" }) } }
    );

    const pw = await AuthService.hashPassword(password);
    const admin = await crud.createOne(prisma.admin, { email, name, password: pw, profileId: profile.id });
    reply.success(admin).setCookie({ template: "REFRESH_ACCESS", rememberMe }).respond();
  }

  static async confirmSignin(req: ApiRequest<never, never, AuthPayload.ConfirmSigninQuery>, { reply }: ApiResponse<"SUCCESS">) {
    const parsed = AuthService.parseSecret(req.query.secret.toString());
    if (!parsed) {
      throw new ServerError("CLIENT_TYPE", { field: "secret" });
    }
    const secret = AuthService.createSecret(parsed.otp, parsed.session, parsed.adminId);
    const verif = await crud.getOne(
      prisma.verification,
      { type: "CONFIRMATION_AUTH", secret },
      { error: { notFound: new ServerError("INVALID_VERIF_TOKEN") } }
    );
    const info = JSON.parse(verif.info) as AuthVerificationInfo;
    info.verified = true;
    await crud.updateById(prisma.verification, verif.id, { info: JSON.stringify(info), expires: new Date(Date.now() + timeInMs({ minute: 15 })) });
    reply.success("SUCCESS").respond();
  }

  static async signinByOtp(req: ApiRequest<AuthPayload.SigninByOtpBody, never, never>, { reply }: ApiResponse<Admin>) {
    const { otp } = req.body;
    const session = decrypt(req.body.session) || "";
    const startsWith = `otp=${otp}`;
    const endsWith = `session=${session}`;

    const verif = await crud.getOne(
      prisma.verification,
      { type: "OTP_AUTH", secret: { startsWith, endsWith } },
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

  static async signinByConfirm(req: ApiRequest<never, never, AuthPayload.SigninByConfirmQuery>, { reply }: ApiResponse<Admin>) {
    const session = decrypt(req.query.session.toString()) || "";

    const verif = await crud.getOne(
      prisma.verification,
      { secret: { endsWith: `session=${session}` }, type: "CONFIRMATION_AUTH" },
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
