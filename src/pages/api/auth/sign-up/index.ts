import { AuthController } from "../../../../controllers/auth";
import { Route } from "@/services/route";

export default Route.create({ POST: AuthController.signup }, { POST: AuthController.routeOptions.signup });
