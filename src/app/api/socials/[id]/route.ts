import { Route } from "@/lib/route";
import { SocialController } from "../../_controllers/social";

export default Route.create(
  { GET: SocialController.get, DELETE: SocialController.softDelete, PUT: SocialController.update },
  { PUT: SocialController.routeOptions.update, ...SocialController.routeOptions.singleParam }
);
