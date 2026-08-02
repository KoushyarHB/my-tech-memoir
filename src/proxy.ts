import createMiddleware from "next-intl/middleware";
import { auth } from "@/auth";
import { routing } from "@/i18n/routing";

const handleI18n = createMiddleware(routing);

export default auth((req) => {
  return handleI18n(req);
});

export const config = {
  // Match all pathnames except:
  // - /api, /trpc, /_next, /_vercel
  // - /admin (admin panel is locale-independent)
  // - files with extensions (favicon.ico, images, etc.)
  matcher: ["/((?!api|trpc|_next|_vercel|admin|.*\\..*).*)"],
};
