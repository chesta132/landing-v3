import { AuthController } from "../../../controllers/auth";

declare module "@/types/endpoints" {
  namespace Endpoints {
    interface Auth {
      post:
        | BuildEndpoint<"/sign-up", typeof AuthController.signup>
        | BuildEndpoint<"/sign-in", typeof AuthController.signin>
        | BuildEndpoint<"/sign-in/otp", typeof AuthController.signinByOtp>
        | BuildEndpoint<"/sign-in/confirm", typeof AuthController.confirmSignin>;
      get: BuildEndpoint<"/sign-in/confirm", typeof AuthController.signinByConfirm>;
      patch: BuildEndpoint<"/sign-up/allow", typeof AuthController.allowCreate>;
    }
  }
  interface Endpoints extends Endpoints.Auth {}
}
