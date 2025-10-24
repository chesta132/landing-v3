import { Social } from "@prisma/client";

export abstract class SocialEntity {
  static readonly UPDATABLE_FIELDS = ["provider", "url"] satisfies (keyof Social)[];

  static readonly default: Social = { deleteAt: null, id: "", isRecycled: false, profileId: "", provider: "", url: "" };
}
