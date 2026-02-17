interface Props {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function DiagnosisStep({
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
          Diagnosis Information
        </h2>
        <p className="text-neutral-500 text-sm">
          Help us understand your bleeding disorder.
        </p>
      </div>

      <FormField label="Primary Condition" required>
        <select
          required
          value={data.primaryCondition}
          onChange={(e) => updateData({ primaryCondition: e.target.value })}
          className={inputClass}
        >
          <option value="">Select condition...</option>
          <option value="hemophilia_a">Hemophilia A</option>
          <option value="hemophilia_b">Hemophilia B</option>
          <option value="von_willebrand">Von Willebrand Disease</option>
          <option value="other">Other Bleeding Disorder</option>
        </select>
      </FormField>

      <FormField label="Severity" required>
        <select
          required
          value={data.severity}
          onChange={(e) => updateData({ severity: e.target.value })}
          className={inputClass}
        >
          <option value="">Select severity...</option>
          <option value="mild">Mild</option>
          <option value="moderate">Moderate</option>
          <option value="severe">Severe</option>
        </select>
      </FormField>

      <FormField label="Date of Diagnosis" required>
        <input
          type="date"
          required
          value={data.diagnosisDate}
          onChange={(e) => updateData({ diagnosisDate: e.target.value })}
          className={inputClass}
        />
      </FormField>

      <FormField label="Treating Physician">
        <input
          type="text"
          value={data.treatingPhysician}
          onChange={(e) => updateData({ treatingPhysician: e.target.value })}
          className={inputClass}
          placeholder="Dr. Smith"
        />
      </FormField>

      <FormField label="Specialty Pharmacy">
        <input
          type="text"
          value={data.specialtyPharmacy}
          onChange={(e) => updateData({ specialtyPharmacy: e.target.value })}
          className={inputClass}
          placeholder="Pharmacy name"
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
  w-full px-4 py-2.5 rounded-xl border border-neutral-200
  text-neutral-900 text-sm placeholder:text-neutral-400
  focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
  transition-colors
`.trim();
