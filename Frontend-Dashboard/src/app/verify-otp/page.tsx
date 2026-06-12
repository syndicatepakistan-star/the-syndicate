import AuthScreen from "@/components/syndicate-otp/AuthScreen";

type PageProps = {
  searchParams: Promise<{
    email?: string;
    flow?: string;
    playlist_id?: string;
    plan?: string;
    billing?: string;
    amount?: string;
    next?: string;
    ticket?: string;
  }>;
};

export default async function VerifyOtpPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const playlistId = typeof params.playlist_id === "string" ? params.playlist_id : "";
  const flow = params.flow === "signup" ? "signup" : "login";
  const selectedPlan = typeof params.plan === "string" ? params.plan : "";
  const selectedBilling = typeof params.billing === "string" ? params.billing : "";
  const selectedAmount = typeof params.amount === "string" ? params.amount : "";
  const postLoginNext = typeof params.next === "string" ? params.next : "";
  const selectedTicket = typeof params.ticket === "string" ? params.ticket : "";
  return (
    <div id="syndicate-otp-mount" className="min-h-dvh">
      <AuthScreen
        mode="otp"
        prefilledEmail={email}
        prefilledPlaylistId={playlistId}
        otpFlow={flow}
        selectedPlan={selectedPlan}
        selectedBilling={selectedBilling}
        selectedAmount={selectedAmount}
        postLoginNext={postLoginNext}
        selectedTicket={selectedTicket}
      />
    </div>
  );
}
