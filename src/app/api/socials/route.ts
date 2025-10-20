import { Route } from "@/lib/server/route";
import { SocialController } from "../_controllers/social";

export default Route.create(
  {
    GET: SocialController.getMany,
    PUT: SocialController.updateMany,
    POST: SocialController.create,
    DELETE: SocialController.softDeleteMany,
  },
  {
    POST: { neededBody: SocialController.neededBodyToCreate },
    PUT: { neededBody: SocialController.neededBodyToUpdateMany },
    DELETE: { neededBody: SocialController.neededBodyToSoftDeleteMany },
  }
);
