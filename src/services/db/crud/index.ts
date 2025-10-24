import * as create from "./create";
import * as read from "./read";
import * as update from "./update";
import * as deletes from "./delete";

export const crud = {
  ...create,
  ...read,
  ...update,
  ...deletes,
} as const;

export default crud;

export const sortValue = ["asc", "desc"] as const;
