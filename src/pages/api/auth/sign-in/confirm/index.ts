import { AuthController } from "@/pages/api/_controllers/auth";
import { Route } from "@/lib/route";

export default Route.create({ POST: AuthController.confirmSignin, GET: AuthController.signinByConfirm });
