import { Profile } from "@prisma/client";

export namespace ProfilePayload {
  // Body
  type CreateBody = Pick<Profile, "bio" | "avatarUrl" | "name"> & { location?: string };
  type UpdateBody = Partial<Pick<Profile, "bio" | "avatarUrl" | "name"> & { location?: string }>;

  // Param
  type SingleParam = { id: string };

  // Query
  type DeleteQuery = { token: string };
}
