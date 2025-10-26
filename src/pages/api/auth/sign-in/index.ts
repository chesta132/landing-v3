import { AuthController } from "../../../../controllers/auth";
import { Route } from "@/services/route";

export default Route.create({ POST: AuthController.signin }, { POST: AuthController.routeOptions.signin });
