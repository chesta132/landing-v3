import prisma from "@/services/db/client";
import crud from "@/services/db/crud";
import { ServerError } from "@/services/server-error";
import { ApiRequest, ApiResponse } from "@/types/server";
import { Admin } from "@prisma/client";
import bcrypt from "bcrypt";

export type SigninPayload = Pick<Admin, "email" | "password"> & { rememberMe: boolean };
export type SignupPayload = Pick<Admin, "email" | "password" | "name"> & { rememberMe: boolean };

export abstract class AuthController {
  static neededBodySignin = ["email", "password", "rememberMe"];
  static neededBodySignup = ["email", "password", "rememberMe", "name"];

  static async signin(req: ApiRequest<SigninPayload, never, never>, { reply }: ApiResponse<Admin>) {
    const { email, password, rememberMe } = req.body;

    const admin = await crud.getOne(prisma.admin, { email }, { error: null });
    if (!admin || !admin.password) {
      throw new ServerError("CLIENT_FIELD", { field: "email", message: "Email not registered" });
    }

    const passwordValid = await bcrypt.compare(password.trim(), admin.password);
    if (!passwordValid) {
      throw new ServerError("CLIENT_FIELD", { field: "password", message: "Incorrect Password" });
    }

    reply.success(admin).setCookie({ template: "REFRESH_ACCESS", rememberMe }).respond();
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
