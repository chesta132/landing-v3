import jwt from "jsonwebtoken";
import { NODE_ENV } from "@/config";
import { timeInMs } from "./manipulate/number";
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

export type JwtPayload = jwt.JwtPayload & { adminId: string; expires: Date };

export const accessTokenConfig: Omit<ResponseCookie, "name" | "value"> = {
  httpOnly: true,
  secure: NODE_ENV === "production",
  sameSite: "strict",
  maxAge: timeInMs({ minute: 5 }),
};

export const refreshTokenConfig: Omit<ResponseCookie, "name" | "value"> = {
  httpOnly: true,
  secure: NODE_ENV === "production",
  sameSite: "strict",
  maxAge: timeInMs({ week: 2 }),
};

export const refreshTokenSessionOnlyConfig: Omit<ResponseCookie, "name" | "value"> = {
  httpOnly: true,
  secure: NODE_ENV === "production",
  sameSite: "strict",
};

type ExpiresIn = Parameters<typeof jwt.sign>[2]["expiresIn"];

export const createAccessToken = (payload: JwtPayload, expiresIn?: ExpiresIn | null) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, expiresIn !== null ? { expiresIn: "5m" } : {});
};

export const createRefreshToken = (payload: JwtPayload, expiresIn?: ExpiresIn | null) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, expiresIn !== null ? { expiresIn: "2w" } : {});
};

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload;
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JwtPayload;
  } catch (error) {
    return null;
  }
};
