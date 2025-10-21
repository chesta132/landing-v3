import { Route } from "@/lib/server/route";
import { SocialController } from "../../_controllers/social";

export default Route.create({ POST: SocialController.restoreMany }, { POST: SocialController.routeOptions.restoreMany });
