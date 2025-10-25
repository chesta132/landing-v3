import { AuthController } from "../../_controllers/auth";
import { Route } from "@/lib/route";

export default Route.create({ POST: AuthController.signin }, { POST: AuthController.routeOptions.signin });
