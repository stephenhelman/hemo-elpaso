import { useState } from "react";
import { Shield, Camera, Mail } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  data: any;
  updateData: (data: any) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export default function ConsentStep({
  data,
  updateData,
  onSubmit,
  onBack,
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!data.hipaaConsent) {
      toast.error("HIPAA consent is required to continue.");
      return;
    }

    setLoading(true);
    await onSubmit();
    setLoading(false);
  };

  const allConsentsGiven =
    data.hipaaConsent && data.photoConsent && data.communicationConsent;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-neutral-900 text-xl mb-1">
          Consent & Agreements
        </h2>
        <p className="text-neutral-500 text-sm">
          Review and accept the following to complete your registration.
        </p>
      </div>

      {/* HIPAA Consent */}
      <ConsentCard
        icon={<Shield className="w-5 h-5" />}
        title="HIPAA Authorization"
        description="I authorize HOEP to collect, use, and disclose my protected health information for the purpose of providing support services, event coordination, and community programs."
        required
        checked={data.hipaaConsent}
        onChange={(checked) => updateData({ hipaaConsent: checked })}
      />

      {/* Photo Consent */}
      <ConsentCard
        icon={<Camera className="w-5 h-5" />}
        title="Photo & Media Release"
        description="I grant permission for HOEP to use photographs and videos taken at events for promotional purposes, including social media, website, and printed materials."
        checked={data.photoConsent}
        onChange={(checked) => updateData({ photoConsent: checked })}
      />

      {/* Communication Consent */}
      <ConsentCard
        icon={<Mail className="w-5 h-5" />}
        title="Communications Consent"
        description="I consent to receive event notifications, newsletters, and community updates via email and SMS. You can unsubscribe at any time."
        checked={data.communicationConsent}
        onChange={(checked) => updateData({ communicationConsent: checked })}
      />

      {/* Privacy Notice */}
      <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
        <p className="text-xs text-neutral-600 leading-relaxed">
          🔒 <strong>Your privacy matters.</strong> All data is encrypted,
          HIPAA-compliant, and stored securely on AWS infrastructure. We never
          sell or share your information with third parties. You can request a
          copy of your data or delete your account at any time by contacting us
          at{" "}
          <a
            href="mailto:info@hemo-el-paso.org"
            className="text-primary hover:underline"
          >
            info@hemo-el-paso.org
          </a>
          .
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto px-6 py-3 text-sm sm:text-base rounded-full border-2 border-neutral-300 text-neutral-700 font-semibold hover:border-neutral-400 transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading || !data.hipaaConsent}
          className="w-full sm:flex-1 px-6 py-3 text-sm sm:text-base rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          {loading
            ? "Submitting..."
            : allConsentsGiven
              ? "Complete Registration"
              : "Complete Registration"}
        </button>
      </div>
    </form>
  );
}

function ConsentCard({
  icon,
  title,
  description,
  required,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  required?: boolean;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex gap-4 p-4 rounded-xl border-2 border-neutral-200 hover:border-primary-200 transition-colors cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 rounded border-neutral-300 text-primary focus:ring-primary mt-0.5 flex-shrink-0"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-primary">{icon}</span>
          <h3 className="font-semibold text-neutral-900 text-sm">
            {title}
            {required && <span className="text-red-500 ml-1">*</span>}
          </h3>
        </div>
        <p className="text-sm text-neutral-500 leading-relaxed">
          {description}
        </p>
      </div>
    </label>
  );
}
