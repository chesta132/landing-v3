import { AuthController } from "@/controllers/auth";
import { Route } from "@/services/route";

export default Route.create({ PATCH: AuthController.allowCreate }, { PATCH: AuthController.routeOptions.allowCreate });
