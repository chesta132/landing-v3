import { TechController } from "@/controllers/tech";
import { Route } from "@/services/route";

export default Route.create({ POST: TechController.restore }, TechController.routeOptions.singleParam);
