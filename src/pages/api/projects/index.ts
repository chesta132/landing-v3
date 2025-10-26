import { Route } from "@/services/route";
import { ProjectController } from "../../../controllers/project";

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
