import { AuthController } from "@/controllers/auth";
import { Route } from "@/services/route";

export default Route.create({ POST: AuthController.confirmSignin, GET: AuthController.signinByConfirm });
