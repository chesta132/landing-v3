import { Route } from "@/lib/server/route";
import { ProjectController } from "../../_controllers/project";

export default Route.create(
  { PUT: ProjectController.update, GET: ProjectController.get, DELETE: ProjectController.softDelete },
  { PUT: ProjectController.routeOptions.update }
);
