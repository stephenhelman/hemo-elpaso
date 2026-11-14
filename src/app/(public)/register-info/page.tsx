import RegisterInfoForm from "@/components/register-info/RegisterInfoForm";
import RegisterInfoHeading from "@/components/register-info/RegisterInfoHeading";
import RegistrationClosed from "@/components/register-info/RegistrationClosed";
import { registrationOpen } from "@/lib/registration";

export const dynamic = "force-dynamic"; // REGISTRATION_OPEN is read at request time

export default function RegisterInfoPage() {
  if (!registrationOpen()) return <RegistrationClosed />;

  // Read at request time on the server; the public site key is handed to the client form.
  const turnstileSiteKey = process.env.TURNSTILE_SITE_KEY ?? null;
  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="container-max px-4 sm:px-6 lg:px-8 py-12 max-w-2xl mx-auto">
        <RegisterInfoHeading />
        <RegisterInfoForm turnstileSiteKey={turnstileSiteKey} />
      </div>
    </div>
  );
}
