import { nextOptimizedImageUrl } from "@/lib/optimizeImageUrl";

/** Auth LCP — small nav logo via Next optimizer (not 144KB logo.webp). */
export const AUTH_LOGO_LCP_HREF = nextOptimizedImageUrl("/assets/logo-nav.webp", 384, 55);

/** Tiny critical CSS so auth paints black before syndicate-otp.css / globals settle. */
export const AUTH_CRITICAL_CSS = [
  "html,body{background:#000!important;color-scheme:dark}",
  "#syndicate-otp-mount{min-height:100dvh;background:#050505;color:#e8d68a}",
  "#syndicate-otp-mount .login-container{min-height:min(70dvh,36rem)}",
  "#syndicate-otp-mount .brand-logo{display:block;width:clamp(10rem,55vw,16rem);max-width:min(260px,72vw);height:auto;margin:0 auto 1rem}",
].join("");

/** Shared head chrome for /login, /signup, /verify-otp (and syndicate-otp twin routes). */
export function AuthRouteHead() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: AUTH_CRITICAL_CSS }} />
      <link rel="preload" as="image" href={AUTH_LOGO_LCP_HREF} fetchPriority="high" />
    </>
  );
}
