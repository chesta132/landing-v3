import { createRoute } from "@/lib/server/createRoute";
import { ProfileController } from "../../_controller/profile";

export default createRoute({ PUT: ProfileController.update, DELETE: ProfileController.delete }, undefined, { PUT: ProfileController });
