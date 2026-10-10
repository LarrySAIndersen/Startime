import { NextResponse } from "next/server";
import { keycloakAuthorizeUrl } from "@/lib/auth";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  if (process.env.AUTH_DEV_BYPASS === "1") {
    return NextResponse.redirect(new URL("/overblik", origin));
  }
  return NextResponse.redirect(keycloakAuthorizeUrl(origin));
}
