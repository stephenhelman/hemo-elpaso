type Way = {
  icon: any;
  title: string;
  body: string;
  color: string;
  anchor: string;
  cta: string;
};

interface Props {
  way: Way;
  onCta?: () => void;
}

const iconColors: Record<string, string> = {
  primary: "bg-primary-50 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/10 text-accent-dark",
};

export function WayCard({ way, onCta }: Props) {
  const Icon = way.icon;
  return (
    <div className="flex flex-col p-6 rounded-2xl bg-white border border-neutral-200 hover:border-primary-200 hover:shadow-md transition-all duration-200">
      <div
        className={`w-14 h-14 rounded-2xl ${iconColors[way.color]} flex items-center justify-center mb-4`}
      >
        <Icon />
      </div>
      <h3 className="font-display font-bold text-neutral-900 text-lg mb-2">
        {way.title}
      </h3>
      <p className="text-neutral-500 text-sm leading-relaxed mb-5 flex-1">
        {way.body}
      </p>
      {onCta ? (
        <button
          onClick={onCta}
          className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary-600 transition-colors"
        >
          {way.cta} →
        </button>
      ) : (
        <a
          href={way.anchor}
          className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary-600 transition-colors"
        >
          {way.cta} →
        </a>
      )}
    </div>
  );
}
