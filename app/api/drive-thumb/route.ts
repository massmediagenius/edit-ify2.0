import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const url = request.nextUrl.searchParams.get("url");

  if (!id && !url) return new NextResponse("Missing id or url", { status: 400 });

  // Build candidate URLs to try in order
  const candidates: string[] = [];
  if (url) candidates.push(decodeURIComponent(url));
  if (id) {
    candidates.push(`https://drive.google.com/thumbnail?id=${id}&sz=w400`);
    candidates.push(`https://lh3.googleusercontent.com/d/${id}=w400`);
  }

  for (const thumbUrl of candidates) {
    try {
      const res = await fetch(thumbUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (!res.ok) continue;

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.startsWith("image/")) continue;

      const buffer = await res.arrayBuffer();
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600",
        },
      });
    } catch {
      continue;
    }
  }

  return new NextResponse(null, { status: 404 });
}
