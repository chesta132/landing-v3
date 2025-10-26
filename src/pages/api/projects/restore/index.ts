import { ProjectController } from "@/controllers/project";
import { Route } from "@/services/route";

export default Route.create({ POST: ProjectController.restoreMany }, { POST: ProjectController.routeOptions.restoreMany });
