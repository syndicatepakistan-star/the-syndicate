import AuthScreen from "@/components/syndicate-otp/AuthScreen";
import MobileAuthBackToHome from "@/components/syndicate-otp/MobileAuthBackToHome";
import RedirectWhenAuthed from "@/components/syndicate-otp/RedirectWhenAuthed";

type PageProps = {
  searchParams: Promise<{
    email?: string;
    playlist_id?: string;
    plan?: string;
    billing?: string;
    amount?: string;
    next?: string;
    ticket?: string;
  }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const playlistId = typeof params.playlist_id === "string" ? params.playlist_id : "";
  const selectedPlan = typeof params.plan === "string" ? params.plan : "";
  const selectedBilling = typeof params.billing === "string" ? params.billing : "";
  const selectedAmount = typeof params.amount === "string" ? params.amount : "";
  const postLoginNext = typeof params.next === "string" ? params.next : "";
  const selectedTicket = typeof params.ticket === "string" ? params.ticket : "";
  return (
    <div id="syndicate-otp-mount" className="min-h-dvh">
      <MobileAuthBackToHome />
      <RedirectWhenAuthed />
      <AuthScreen
        mode="login"
        prefilledEmail={email}
        prefilledPlaylistId={playlistId}
        selectedPlan={selectedPlan}
        selectedBilling={selectedBilling}
        selectedAmount={selectedAmount}
        postLoginNext={postLoginNext}
        selectedTicket={selectedTicket}
      />
    </div>
  );
}
