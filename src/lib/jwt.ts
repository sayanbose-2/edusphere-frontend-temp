import type { IJwtPayload } from "@/types/authTypes";

const decodeJwt = (token: string): IJwtPayload => {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[1]) {
    throw new Error("Invalid JWT token format");
  }
  const base64Url = parts[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join(""),
  );
  return JSON.parse(jsonPayload);
};

const isTokenExpired = (token: string): boolean => {
  try {
    const payload = decodeJwt(token);
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export { decodeJwt, isTokenExpired };
