import { SocialController } from "@/controllers/social";
import { Route } from "@/services/route";

export default Route.create({ POST: SocialController.restore });
