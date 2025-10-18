import { Reply } from "@/services/reply";
import { NextApiRequest, NextApiResponse } from "next";

export type AllowedMethods = "POST" | "GET" | "PUT" | "DELETE" | "PATCH";
export type BodyableMethods = "POST" | "PUT" | "DELETE" | "PATCH";

export interface ApiRequest<Body = any, Param extends string = string & {}, Query extends string = string & {}> extends NextApiRequest {
  body: Body;
  query: Record<Param | Query, string[] | string | undefined>;
}
export interface ApiResponse<Data = any> extends NextApiResponse<Data> {
  reply: Reply<Data>;
}

export type Handler = (req: ApiRequest<any & never>, res: ApiResponse<any>) => Promise<void> | void;
export type Recoverer = (err: unknown, req: ApiRequest<any & never>, res: ApiResponse<any>) => Promise<void> | void;

export type Handlers = RequireAtLeastOne<Record<AllowedMethods, Handler>>;
