interface Props {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
}

export default function BasicInfoStep({ data, updateData, onNext }: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-neutral-900 text-xl mb-1">
          Basic Information
        </h2>
        <p className="text-neutral-500 text-sm">
          Let's start with your basic details.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="First Name" required>
          <input
            type="text"
            required
            value={data.firstName}
            onChange={(e) => updateData({ firstName: e.target.value })}
            className={inputClass}
            placeholder="First name"
          />
        </FormField>

        <FormField label="Last Name" required>
          <input
            type="text"
            required
            value={data.lastName}
            onChange={(e) => updateData({ lastName: e.target.value })}
            className={inputClass}
            placeholder="Last name"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Date of Birth" required>
          <input
            type="date"
            required
            value={data.dateOfBirth}
            onChange={(e) => updateData({ dateOfBirth: e.target.value })}
            className={inputClass}
          />
        </FormField>

        <FormField label="Phone Number" required>
          <input
            type="tel"
            required
            value={data.phone}
            onChange={(e) => updateData({ phone: e.target.value })}
            className={inputClass}
            placeholder="(555) 555-5555"
          />
        </FormField>
      </div>

      <FormField label="Street Address" required>
        <input
          type="text"
          required
          value={data.address}
          onChange={(e) => updateData({ address: e.target.value })}
          className={inputClass}
          placeholder="123 Main St"
        />
      </FormField>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <FormField label="City" required>
          <input
            type="text"
            required
            value={data.city}
            onChange={(e) => updateData({ city: e.target.value })}
            className={inputClass}
            placeholder="El Paso"
          />
        </FormField>

        <FormField label="State" required>
          <select
            required
            value={data.state}
            onChange={(e) => updateData({ state: e.target.value })}
            className={inputClass}
          >
            <option value="TX">TX</option>
            <option value="NM">NM</option>
            <option value="AZ">AZ</option>
          </select>
        </FormField>

        <FormField label="ZIP Code" required>
          <input
            type="text"
            required
            pattern="[0-9]{5}"
            value={data.zipCode}
            onChange={(e) => updateData({ zipCode: e.target.value })}
            className={inputClass}
            placeholder="79901"
          />
        </FormField>
      </div>

      <div className="flex justify-end pt-4">
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
