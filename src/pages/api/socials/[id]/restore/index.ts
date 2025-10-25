import { SocialController } from "@/pages/api/_controllers/social";
import { Route } from "@/lib/route";

export default Route.create({ POST: SocialController.restore });
