import { Route } from "@/services/route";
import { TechController } from "../../../../controllers/tech";

export default Route.create({ POST: TechController.restoreMany }, { POST: TechController.routeOptions.restoreMany });
