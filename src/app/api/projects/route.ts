import { Route } from "@/lib/server/route";
import { ProjectController } from "../_controllers/project";

export default Route.create(
  {
    GET: ProjectController.getMany,
    DELETE: ProjectController.softDeleteMany,
    POST: ProjectController.create,
    PUT: ProjectController.updateMany,
  },
  {
    DELETE: ProjectController.routeOptions.softDeleteMany,
    POST: ProjectController.routeOptions.create,
    PUT: ProjectController.routeOptions.updateMany,
  }
);
