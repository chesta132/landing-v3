import { AuthController } from "../_controllers/auth";

declare module "@/types/endpoints" {
  namespace Endpoints {
    interface Auth {
      post:
        | BuildEndpoint<"/sign-up", typeof AuthController.signup>
        | BuildEndpoint<"/sign-in", typeof AuthController.signin>
        | BuildEndpoint<"/sign-in/otp", typeof AuthController.signinByOtp>
        | BuildEndpoint<"/sign-in/confirm", typeof AuthController.confirmSignin>;
      get: BuildEndpoint<"/sign-in/confirm", typeof AuthController.signinByConfirm>;
    }
  }
  interface Endpoints extends Endpoints.Auth {}
}
