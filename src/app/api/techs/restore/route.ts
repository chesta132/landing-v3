import { Route } from "@/lib/server/route";
import { TechController } from "../../_controllers/tech";

export default Route.create({ POST: TechController.restoreMany }, { POST: TechController.routeOptions.restoreMany });
