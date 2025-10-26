import { encrypt } from "@/lib/crypto";
import { timeInMs } from "@/lib/manipulate/number";
import { AuthService } from "@/services/auth";
import prisma from "@/services/db/client";
import crud from "@/services/db/crud";
import { generateOTP } from "@/services/email/mailer";
import { ServerError } from "@/services/server-error";
import { ApiRequest, ApiResponse, CreateRouteOptionsBase } from "@/services/route/types";
import { $Enums, Admin } from "@prisma/client";
import { UAParser } from "ua-parser-js";
import z from "zod";
import { AuthPayload } from "./payload";
import { NODE_ENV } from "@/config";
import { SignupService } from "@/services/auth/signup";
import { SigninService } from "@/services/auth/signin";

export type SigninResponse = { type: $Enums.AdminAuth; session: string };

export abstract class AuthController {
  static readonly routeOptions = {
    signin: { bodyValidator: z.object({ email: z.email(), password: z.string(), rememberMe: z.boolean() }).strip() },
    signup: { bodyValidator: z.object({ email: z.email(), password: z.string(), rememberMe: z.boolean().optional(), name: z.string() }).strip() },
    sigininByOtp: { bodyValidator: z.object({ otp: z.string(), session: z.string() }).strip() },
    signinByConfirm: { queryValidator: z.object({ session: z.string() }).strip() },
    confirmSignin: { queryValidator: z.object({ secret: z.string() }).strip() },
    allowCreate: { queryValidator: z.object({ secret: z.string() }).strip() },
  } satisfies Record<string, CreateRouteOptionsBase>;

  static async signin(req: ApiRequest<AuthPayload.SigninBody, never, never>, { reply }: ApiResponse<SigninResponse>) {
    const { email, password, rememberMe } = req.body;
    const ua = new UAParser(req.headers["user-agent"]).getResult();
    const admin = await SigninService.getByEmailWithAuth({ email, password });

    const otp = generateOTP();
    const session = crypto.randomUUID();
    const expires = new Date(Date.now() + timeInMs({ minute: 10 }));
    const secret = AuthService.createSecret(otp, session, admin.id);

    await AuthService.authStrategy(admin, { expires, rememberMe, secret, ua });
    reply.success({ type: admin.auth, session: encrypt(session) }).respond();
  }

  static async signup(req: ApiRequest<AuthPayload.SignupBody, never, never>, { reply }: ApiResponse<"SUCCESS" | Admin>) {
    const { email, name, password, rememberMe } = req.body;

    await crud.getOne(
      prisma.admin,
      { email },
      { error: { found: new ServerError("CLIENT_FIELD", { field: "email", message: "Email already registered" }) } }
    );
    const profile = await AuthService.getProfile("SIGN_UP");
    const pw = await AuthService.hashPassword(password);

    if (NODE_ENV === "production") {
      await SignupService.createConfirmation({ email, hashedPassword: pw, name });
      reply.success("SUCCESS").respond();
    } else {
      const admin = await crud.createOne(prisma.admin, { email, name, password: pw, profileId: profile.id });
      reply.success(admin).setCookie({ template: "REFRESH_ACCESS", rememberMe }).respond();
    }
  }

  static async confirmSignin(req: ApiRequest<never, never, AuthPayload.ConfirmSigninQuery>, { reply }: ApiResponse<"SUCCESS">) {
    await SigninService.confirmVerification(req.query.secret);
    reply.success("SUCCESS").respond();
  }

  static async signinByOtp(req: ApiRequest<AuthPayload.SigninByOtpBody, never, never>, { reply }: ApiResponse<Admin>) {
    const { otp, session } = req.body;
    const {
      parsedInfo: { rememberMe },
      parsedSecret,
      verif,
    } = await SigninService.getVerifiedByOtp({ encryptedSession: session, otp });

    const admin = await crud.getById(prisma.admin, parsedSecret.adminId);

    await crud.deleteById(prisma.verification, verif.id);
    reply.success(admin).setCookie({ template: "REFRESH_ACCESS", rememberMe }).respond();
  }

  static async signinByConfirm(req: ApiRequest<never, never, AuthPayload.SigninByConfirmQuery>, { reply }: ApiResponse<Admin>) {
    const { parsedInfO, verif, parsedSecret } = await SigninService.getVerifiedByConfirm(req.query.session);

    const admin = await crud.getById(prisma.admin, parsedSecret.adminId);

    await crud.deleteById(prisma.verification, verif.id);
    reply.success(admin).setCookie({ template: "REFRESH_ACCESS", rememberMe: parsedInfO.rememberMe }).respond();
  }

  static async allowCreate(req: ApiRequest<never, never, AuthPayload.AllowCreateQuery>, { reply }: ApiResponse<"SUCCESS">) {
    await SignupService.allowCreateAdmin(req.query.secret);
    reply.success("SUCCESS").respond();
  }
}
