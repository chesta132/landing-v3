import { TechController } from "@/app/api/_controllers/tech";
import { Route } from "@/lib/route";

export default Route.create({ POST: TechController.restore }, TechController.routeOptions.singleParam);
