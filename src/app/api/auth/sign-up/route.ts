import { createRoute } from "@/lib/server/createRoute";
import { AuthController } from "../../_controllers/auth";

export default createRoute({ POST: AuthController.signup }, undefined, { POST: { neededBody: AuthController.neededBodySignup } });
