import { Route } from "@/lib/server/route";
import { SocialController } from "../../_controllers/social";

export default Route.create(
  { GET: SocialController.get, DELETE: SocialController.softDelete, PUT: SocialController.update },
  { PUT: { neededBody: SocialController.neededBodyToUpdate } }
);
