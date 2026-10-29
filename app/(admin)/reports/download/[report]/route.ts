import { NextResponse } from "next/server";
import { parseErrorResponse } from "@/lib/api/errors";
import { fetchReportCsv } from "@/lib/api/reports";
import { parseDateParam } from "@/lib/report-params";
import { reportBySlug } from "@/lib/reports";
import { hasRole } from "@/lib/roles";
import { getSession } from "@/lib/session";

// The API needs the bearer token, which never reaches the browser, so a CSV download goes
// through here: check the session and role, ask the API for the CSV, and stream it back.
export async function GET(
  request: Request,
  ctx: RouteContext<"/reports/download/[report]">,
) {
  const { report } = await ctx.params;
  const info = reportBySlug(report);
  if (!info) return new Response("Report not found.", { status: 404 });

  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/login", request.url));
  if (session.mustChangePassword) {
    return NextResponse.redirect(new URL("/change-password", request.url));
  }
  if (!hasRole(session.role, info.roles)) {
    return new Response("You do not have permission to download this report.", {
      status: 403,
    });
  }

  // Only the dates this report understands are forwarded, and only if they are real dates.
  const incoming = new URL(request.url).searchParams;
  const query: Record<string, string> = {};
  for (const name of info.params) {
    const value = parseDateParam(incoming.get(name) ?? undefined);
    if (value) query[name] = value;
  }

  const upstream = await fetchReportCsv(info.slug, query);
  if (!upstream) return NextResponse.redirect(new URL("/login", request.url));
  // The backend re-checks the user on every request: 401 means the account changed.
  if (upstream.status === 401) {
    return NextResponse.redirect(new URL("/logout", request.url));
  }
  if (!upstream.ok) {
    const error = await parseErrorResponse(upstream);
    return new Response(error.detail ?? error.message, { status: error.status });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "text/csv; charset=utf-8",
      "Content-Disposition":
        upstream.headers.get("content-disposition") ??
        `attachment; filename="${info.slug}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
