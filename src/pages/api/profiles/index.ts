import { ProfileController } from "../_controllers/profile";
import { Route } from "@/lib/route";

export default Route.create(
  {
    GET: ProfileController.get,
    POST: ProfileController.create,
  },
  { POST: ProfileController.routeOptions.create }
);
