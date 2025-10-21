import { ProjectController } from "@/app/api/_controllers/project";
import { Route } from "@/lib/server/route";

export default Route.create({ POST: ProjectController.restoreMany }, { POST: ProjectController.routeOptions.restoreMany });
