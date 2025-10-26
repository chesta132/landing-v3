import { Route } from "@/services/route";
import { SocialController } from "../../../../controllers/social";

export default Route.create({ POST: SocialController.restoreMany }, { POST: SocialController.routeOptions.restoreMany });
