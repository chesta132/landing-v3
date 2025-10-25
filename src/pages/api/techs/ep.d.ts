import { TechController } from "../_controllers/tech";

declare module "@/types/endpoints" {
  namespace Endpoints {
    interface Tech {
      get: BuildEndpoint<"/", typeof TechController.getMany> | BuildEndpoint<"/{id}", typeof TechController.get>;
      put: BuildEndpoint<"/", typeof TechController.updateMany> | BuildEndpoint<"/{id}", typeof TechController.update>;
      post:
        | BuildEndpoint<"/", typeof TechController.create>
        | BuildEndpoint<"/restore", typeof TechController.restoreMany>
        | BuildEndpoint<"/{id}/restore", typeof TechController.restore>;
      delete: BuildEndpoint<"/", typeof TechController.softDeleteMany> | BuildEndpoint<"/{id}", typeof TechController.softDelete>;
    }
  }
  interface Endpoints extends Endpoints.Tech {}
}
