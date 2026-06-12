import AuthScreen from "@/components/syndicate-otp/AuthScreen";
import MobileAuthBackToHome from "@/components/syndicate-otp/MobileAuthBackToHome";
import RedirectWhenAuthed from "@/components/syndicate-otp/RedirectWhenAuthed";

type PageProps = {
  searchParams: Promise<{ email?: string; playlist_id?: string; plan?: string; billing?: string; amount?: string; buy?: string }>;
};

export default async function SignupPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const playlistId = typeof params.playlist_id === "string" ? params.playlist_id : "";
  const selectedPlan = typeof params.plan === "string" ? params.plan : "";
  const selectedBilling = typeof params.billing === "string" ? params.billing : "";
  const selectedAmount = typeof params.amount === "string" ? params.amount : "";
  const isBuyFlow = params.buy === "1";
  const fromPlaylistUnlock = playlistId.trim().length > 0;
  const fromPlanCheckout = selectedPlan.trim().length > 0 && selectedAmount.trim().length > 0;
  return (
    <div id="syndicate-otp-mount" className="min-h-dvh">
      <MobileAuthBackToHome />
      <RedirectWhenAuthed />
      <AuthScreen
        mode="signup"
        prefilledEmail={email}
        prefilledPlaylistId={playlistId}
        selectedPlan={selectedPlan}
        selectedBilling={selectedBilling}
        selectedAmount={selectedAmount}
      />
    </div>
  );
}
