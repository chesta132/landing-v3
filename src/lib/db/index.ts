import { Delegate } from "@/types/models";
import prisma from "../../services/db/client";

export const getDelegateName = (delegate: Delegate) => {
  for (const [key, value] of Object.entries(prisma)) {
    if (value === delegate) return key;
  }
  return null;
};
