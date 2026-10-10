import { NextResponse } from "next/server";

/** P0-03: exchange code for tokens server-side and set httpOnly session cookie. */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const url = new URL(request.url);
  if (url.searchParams.get("error")) {
    return NextResponse.redirect(new URL("/login?fejl=1", origin));
  }
  // Token exchange not implemented yet — send user to overblik in dev.
  return NextResponse.redirect(new URL("/overblik", origin));
}
