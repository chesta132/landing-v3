import { Admin } from "@prisma/client";
import { infer as ZodInfer } from "zod";
import { AuthController } from "../_controllers/auth";

declare const { routeOptions } = AuthController;
export namespace AuthPayload {
  // Body
  type SigninBody = ZodInfer<typeof routeOptions.signin.bodyValidator>;
  type SignupBody = ZodInfer<typeof routeOptions.signup.bodyValidator>;
  type SigninByOtpBody = ZodInfer<typeof routeOptions.sigininByOtp.bodyValidator>;

  // Query
  type SigninByConfirmQuery = ZodInfer<typeof routeOptions.signinByConfirm.queryValidator>;
  type ConfirmSigninQuery = ZodInfer<typeof routeOptions.confirmSignin.queryValidator>;
}
