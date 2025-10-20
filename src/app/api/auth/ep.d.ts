import { AuthController } from "../_controllers/auth";

declare module "@/types/endpoints" {
  namespace Endpoints {
    interface Auth {
      post:
        | BuildEndpoint<"/auth/sign-up", typeof AuthController.signup>
        | BuildEndpoint<"/auth/sign-in", typeof AuthController.signin>
        | BuildEndpoint<"/auth/sign-in/otp", typeof AuthController.signinByOtp>
        | BuildEndpoint<"/auth/sign-in/confirm", typeof AuthController.confirmSignin>;
      get: BuildEndpoint<"/auth/sign-in/confirm", typeof AuthController.signinByConfirm>;
    }
  }
  interface Endpoints extends Endpoints.Auth {}
}
