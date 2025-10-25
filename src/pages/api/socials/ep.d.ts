import { SocialController } from "../_controllers/social";

declare module "@/types/endpoints" {
  namespace Endpoints {
    interface Social {
      get: BuildEndpoint<"/", typeof SocialController.getMany> | BuildEndpoint<"/{id}", typeof SocialController.get>;
      put: BuildEndpoint<"/", typeof SocialController.updateMany> | BuildEndpoint<"/{id}", typeof SocialController.update>;
      post:
        | BuildEndpoint<"/", typeof SocialController.create>
        | BuildEndpoint<"/restore", typeof SocialController.restoreMany>
        | BuildEndpoint<"/{id}/restore", typeof SocialController.restore>;
      delete: BuildEndpoint<"/", typeof SocialController.softDeleteMany> | BuildEndpoint<"/{id}", typeof SocialController.softDelete>;
    }
  }
  interface Endpoints extends Endpoints.Social {}
}
