interface Props {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function EmergencyContactStep({
  data,
  updateData,
  onNext,
  onBack,
}: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-neutral-900 text-xl mb-1">
          Emergency Contact
        </h2>
        <p className="text-neutral-500 text-sm">
          Who should we contact in case of an emergency?
        </p>
      </div>

      <FormField label="Emergency Contact Name" required>
        <input
          type="text"
          required
          value={data.emergencyName}
          onChange={(e) => updateData({ emergencyName: e.target.value })}
          className={inputClass}
          placeholder="Full name"
        />
      </FormField>

      <FormField label="Relationship" required>
        <select
          required
          value={data.emergencyRelationship}
          onChange={(e) =>
            updateData({ emergencyRelationship: e.target.value })
          }
          className={inputClass}
        >
          <option value="">Select relationship...</option>
          <option value="spouse">Spouse</option>
          <option value="parent">Parent</option>
          <option value="child">Child</option>
          <option value="sibling">Sibling</option>
          <option value="friend">Friend</option>
          <option value="other">Other</option>
        </select>
      </FormField>

      <FormField label="Emergency Phone Number" required>
        <input
          type="tel"
          required
          value={data.emergencyPhone}
          onChange={(e) => updateData({ emergencyPhone: e.target.value })}
          className={inputClass}
          placeholder="(555) 555-5555"
        />
      </FormField>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 rounded-full border-2 border-neutral-300 text-neutral-700 font-semibold hover:border-neutral-400 transition-colors"
        >
          ← Back
        </button>
        <button
          type="submit"
          className="px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
        >
          Continue →
        </button>
      </div>
    </form>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-neutral-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = `
  w-full px-4 py-2 rounded-xl border border-neutral-200
  text-neutral-900 text-sm sm:text-base placeholder:text-neutral-400
  focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
  transition-colors
`.trim();
