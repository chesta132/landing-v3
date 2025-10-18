import { createRoute } from "@/lib/server/createRoute";
import { AuthController } from "../../_controllers/auth";

export default createRoute({ POST: AuthController.signin }, undefined, { POST: { neededBody: AuthController.neededBodySignin } });
