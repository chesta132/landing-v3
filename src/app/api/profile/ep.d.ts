import { ProfileController } from "../_controllers/profile";

declare module "@/types/endpoints" {
  namespace Endpoints {
    interface Profile {
      get: BuildEndpoint<"/profile", typeof ProfileController.get>;
      post: BuildEndpoint<"/profile", typeof ProfileController.create>;
      put: BuildEndpoint<"/profile/{id}", typeof ProfileController.update>;
      delete: BuildEndpoint<"/profile/{id}", typeof ProfileController.delete>;
    }
  }
  interface Endpoints extends Endpoints.Profile {}
}
