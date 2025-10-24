import { ProjectController } from "@/app/api/_controllers/project";
import { Route } from "@/lib/route";

export default Route.create({ POST: ProjectController.restore });
