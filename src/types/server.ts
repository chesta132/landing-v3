import { Reply } from "@/services/reply";
import { Admin } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

export type AllowedMethods = "POST" | "GET" | "PUT" | "DELETE" | "PATCH";
export type BodyableMethods = "POST" | "PUT" | "DELETE" | "PATCH";

export type RequiredQueryValue = string[] | string;
export type QueryValue = string[] | string | undefined;
export type ParamValue = string[] | string;

export interface ApiRequest<Body = any, Param extends Record<string, any> = never, Query extends Record<string, any> = never> extends NextApiRequest {
  body: Body;
  query: ([Query] extends [never] ? {} : Query) & ([Param] extends [never] ? {} : Param);
}
export interface ApiResponse<Data = any> extends NextApiResponse<Data> {
  reply: Reply<Data>;
}

export type Handler = (req: ApiRequest<any & never>, res: ApiResponse<any>, admin: Admin) => Promise<void> | void;
export type Recoverer = (err: unknown, req: ApiRequest<any & never>, res: ApiResponse<any>) => Promise<void> | void;

export type Handlers = RequireAtLeastOne<Record<AllowedMethods, Handler>>;
