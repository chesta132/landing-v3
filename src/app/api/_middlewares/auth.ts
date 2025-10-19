import { verifyAccessToken, verifyRefreshToken } from "@/lib/token";
import { ServerError } from "../../../services/server-error";
import { ApiRequest, ApiResponse } from "@/types/server";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/config";
import crud from "../../../services/db/crud";
import prisma from "../../../services/db/client";

const isRefreshSafe = async (refreshToken: string) => {
  const refreshPayload = verifyRefreshToken(refreshToken);

  if (!refreshPayload) throw new ServerError("INVALID_TOKEN");
  await crud.getOne(prisma.revoked, { value: refreshToken }, { error: null });
  return refreshPayload;
};

export const authMiddleware = async (req: ApiRequest, response: ApiResponse) => {
  const { reply } = response;
  const refreshToken = req.cookies[REFRESH_TOKEN_KEY] || "";
  const accessToken = req.cookies[ACCESS_TOKEN_KEY] || "";

  // refresh token validation
  const refreshPayload = await isRefreshSafe(refreshToken);

  // access token validation
  const payload = verifyAccessToken(accessToken);

  if (!payload) {
    // Check if refresh token exists in database
    const admin = await crud.getById(prisma.admin, refreshPayload.adminId, { error: new ServerError("INVALID_TOKEN") });

    // Set new access token in cookie
    reply.setCookie({ template: "ACCESS", user: admin });

    return admin;
  }

  const admin = await crud.getById(prisma.admin, payload.adminId, {
    error: new ServerError("NOT_FOUND", { item: "admin", desc: "Please sign up first" }),
  });

  // refresh token if payload is expires
  if (new Date(refreshPayload.expires) <= new Date()) {
    reply.setCookie({ template: "REFRESH_ACCESS", rememberMe: true, user: admin });
  }

  return admin;
};
