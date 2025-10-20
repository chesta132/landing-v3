import { AuthController } from "@/app/api/_controllers/auth";
import { Route } from "@/lib/server/route";

export default Route.create({ POST: AuthController.signinByOtp }, { POST: { neededBody: AuthController.neededBodySigninByOtp } });
