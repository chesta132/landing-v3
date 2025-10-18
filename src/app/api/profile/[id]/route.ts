import { createRoute } from "@/lib/server/createRoute";
import { ProfileController } from "../../_controller/profile";
import { Profile as PProfile } from "@prisma/client";

declare module "@/types/endpoints" {
  namespace Endpoints {
    interface Profile {
      put: BuildEndpoint<{ path: "/profile"; response: InferResponseByHandler<typeof ProfileController.update> }>;
      delete: BuildEndpoint<{
        path: "/profile";
        response: InferResponseByHandler<typeof ProfileController.create>;
        body: Pick<PProfile, "bio" | "avatarUrl" | "name"> & Partial<Pick<PProfile, "location">>;
      }>;
    }
  }
  interface Endpoints extends Endpoints.Profile {}
}

export default createRoute({ PUT: ProfileController.update, DELETE: ProfileController.delete }, undefined, { PUT: ProfileController });
