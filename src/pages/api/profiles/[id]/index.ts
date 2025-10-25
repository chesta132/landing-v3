import { ProfileController } from "../../_controllers/profile";
import { Route } from "@/lib/route";

export default Route.create(
  { PUT: ProfileController.update, DELETE: ProfileController.delete },
  { PUT: ProfileController.routeOptions.update, ...ProfileController.routeOptions.singleParam }
);
