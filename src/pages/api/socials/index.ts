import { Route } from "@/services/route";
import { SocialController } from "../../../controllers/social";

export default Route.create(
  {
    GET: SocialController.getMany,
    PUT: SocialController.updateMany,
    POST: SocialController.create,
    DELETE: SocialController.softDeleteMany,
  },
  {
    POST: SocialController.routeOptions.create,
    PUT: SocialController.routeOptions.updateMany,
    DELETE: SocialController.routeOptions.softDeleteMany,
  }
);
