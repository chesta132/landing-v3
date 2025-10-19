import { AuthController } from "../_controllers/auth";

declare module "@/types/endpoints" {
  namespace Endpoints {
    interface Auth {
      post: BuildEndpoint<"/auth/sign-in", typeof AuthController.signin> | BuildEndpoint<"/auth/sign-up", typeof AuthController.signup>;
    }
  }
  interface Endpoints extends Endpoints.Auth {}
}
