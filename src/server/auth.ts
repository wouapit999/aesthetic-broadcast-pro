import jwt, { SignOptions } from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { env } from "./env";

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}

/** Extract & verify the bearer token from a request. Throws if missing/invalid. */
export function requireUser(req: NextRequest): JwtPayload {
  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) throw new HttpError(401, "Authentication required");
  try {
    return verifyToken(token);
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Wrap a route handler with consistent error handling. */
export function handler<Ctx = unknown>(
  fn: (req: NextRequest, ctx: Ctx) => Promise<NextResponse | Response>
) {
  return async (req: NextRequest, ctx: Ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: err.flatten() },
          { status: 400 }
        );
      }
      const message = err instanceof Error ? err.message : "Internal server error";
      if (message.includes("Unique constraint")) {
        return NextResponse.json({ error: "Resource already exists" }, { status: 409 });
      }
      console.error("[api error]", err);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
