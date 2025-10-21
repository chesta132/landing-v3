import { AuthController } from "../../_controllers/auth";
import { Route } from "@/lib/server/route";

export default Route.create({ POST: AuthController.signup }, { POST: AuthController.routeOptions.signup });
