import { ProjectController } from "@/pages/api/_controllers/project";
import { Route } from "@/lib/route";

export default Route.create({ POST: ProjectController.restoreMany }, { POST: ProjectController.routeOptions.restoreMany });
