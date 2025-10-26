import { Route } from "@/services/route";
import { ProjectController } from "../../../../controllers/project";

export default Route.create(
  { PUT: ProjectController.update, GET: ProjectController.get, DELETE: ProjectController.softDelete },
  { PUT: ProjectController.routeOptions.update, ...ProjectController.routeOptions.singleParam }
);
