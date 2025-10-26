import { Reply } from "@/services/reply";
import { Admin } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import { ZodArray, ZodObject } from "zod";

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

export type BodyValidator = ZodObject | ZodArray<ZodObject>;
export type QueryValidator = ZodObject;
export type ParamValidator = ZodObject;
export type CreateRouteOptionsBase = {
  bodyValidator?: BodyValidator;
  queryValidator?: QueryValidator;
  paramValidator?: ParamValidator;
};
export type CreateRouteOptions<H extends Handlers> = Partial<Record<Extract<keyof H, BodyableMethods>, CreateRouteOptionsBase>> & {
  recover?: Recoverer;
  paramValidator?: ParamValidator;
  /**
   * Default is true with domain of client url
   * @default true
   */
  cors?: false | string;
};
