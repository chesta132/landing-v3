import { SocialController } from "@/app/api/_controllers/social";
import { Route } from "@/lib/server/route";

export default Route.create({ POST: SocialController.restore });
