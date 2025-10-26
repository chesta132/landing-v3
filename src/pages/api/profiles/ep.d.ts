import { ProfileController } from "../../../controllers/profile";

declare module "@/types/endpoints" {
  namespace Endpoints {
    interface Profile {
      get: BuildEndpoint<"/", typeof ProfileController.get>;
      post: BuildEndpoint<"/", typeof ProfileController.create>;
      put: BuildEndpoint<"/{id}", typeof ProfileController.update>;
      delete: BuildEndpoint<"/{id}", typeof ProfileController.delete>;
    }
  }
  interface Endpoints extends Endpoints.Profile {}
}
