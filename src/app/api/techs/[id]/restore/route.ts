import { TechController } from "@/app/api/_controllers/tech";
import { Route } from "@/lib/server/route";

export default Route.create({ POST: TechController.restore });
