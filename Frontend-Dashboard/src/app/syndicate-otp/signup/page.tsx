import AuthScreen from "@/components/syndicate-otp/AuthScreen";
import MobileAuthBackToHome from "@/components/syndicate-otp/MobileAuthBackToHome";
import RedirectWhenAuthed from "@/components/syndicate-otp/RedirectWhenAuthed";

type PageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default async function SyndicateOtpSignupPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  return (
    <>
      <MobileAuthBackToHome />
      <RedirectWhenAuthed />
      <AuthScreen mode="signup" prefilledEmail={email} />
    </>
  );
}
