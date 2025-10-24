import { Route } from "@/lib/route";
import { TechController } from "../../_controllers/tech";

export default Route.create(
  { GET: TechController.get, DELETE: TechController.softDelete, PUT: TechController.update },
  { PUT: TechController.routeOptions.update }
);
