import { ProjectController } from "../_controllers/project";

declare module "@/types/endpoints" {
  namespace Endpoints {
    interface Project {
      get: BuildEndpoint<"/", typeof ProjectController.getMany> | BuildEndpoint<"/{id}", typeof ProjectController.get>;
      put: BuildEndpoint<"/", typeof ProjectController.updateMany> | BuildEndpoint<"/{id}", typeof ProjectController.update>;
      post:
        | BuildEndpoint<"/", typeof ProjectController.create>
        | BuildEndpoint<"/restore", typeof ProjectController.restoreMany>
        | BuildEndpoint<"/{id}/restore", typeof ProjectController.restore>;
      delete: BuildEndpoint<"/", typeof ProjectController.softDeleteMany> | BuildEndpoint<"/{id}", typeof ProjectController.softDelete>;
    }
  }
  interface Endpoints extends Endpoints.Project {}
}
