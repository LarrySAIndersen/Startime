import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "ny-applikation",
    timestamp: new Date().toISOString(),
  });
}
