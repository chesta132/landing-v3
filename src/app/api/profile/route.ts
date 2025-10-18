import { createRoute } from "@/lib/server/createRoute";
import { ProfileController } from "../_controller/profile";

declare module "@/types/endpoints" {
  namespace Endpoints {
    interface Profile {
      get: BuildEndpoint<"/profile", typeof ProfileController.get>;
      post: BuildEndpoint<"/profile", typeof ProfileController.create>;
    }
  }
  interface Endpoints extends Endpoints.Profile {}
}

export default createRoute(
  {
    GET: ProfileController.get,
    POST: ProfileController.create,
  },
  undefined,
  { POST: ProfileController }
);
