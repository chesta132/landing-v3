import { Admin } from "@prisma/client";

export namespace AuthPayload {
  // Body
  type SigninBody = Pick<Admin, "email" | "password"> & { rememberMe: boolean };
  type SignupBody = Pick<Admin, "email" | "password" | "name"> & { rememberMe: boolean };
  type SigninByOtpBody = { otp: string; session: string };

  // Query
  type SigninByConfirmQuery = { session: string };
  type ConfirmSigninQuery = { secret: string };
}
