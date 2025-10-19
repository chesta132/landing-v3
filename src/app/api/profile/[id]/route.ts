import { ProfileController } from "../../_controllers/profile";
import { Route } from "@/lib/server/route";

declare module "@/types/endpoints" {
  namespace Endpoints {
    interface Profile {
      put: BuildEndpoint<"/profile", typeof ProfileController.update>;
      delete: BuildEndpoint<"/profile", typeof ProfileController.delete>;
    }
  }
  interface Endpoints extends Endpoints.Profile {}
}

export default Route.create({ PUT: ProfileController.update, DELETE: ProfileController.delete }, { PUT: ProfileController });
