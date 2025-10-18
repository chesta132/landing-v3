import { createRoute } from "@/lib/server/createRoute";
import { ProfileController } from "../../_controller/profile";

declare module "@/types/endpoints" {
  namespace Endpoints {
    interface Profile {
      put: BuildEndpoint<"/profile", typeof ProfileController.update>;
      delete: BuildEndpoint<"/profile", typeof ProfileController.delete>;
    }
  }
  interface Endpoints extends Endpoints.Profile {}
}

export default createRoute({ PUT: ProfileController.update, DELETE: ProfileController.delete }, undefined, { PUT: ProfileController });
