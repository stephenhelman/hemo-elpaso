import Section from "@/components/layout/Section";
import HoepCard from "@/components/ui/HoepCard";
import { missionValuesTranslation } from "@/translation/aboutPage";
import { Heart, Users, BookOpen, Globe } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function MissionValues() {
  const { locale } = useLanguage();
  const t = missionValuesTranslation[locale];

  const iconConfig = {
    bookOpen: <BookOpen className={t.valuesClassName} />,
    heart: <Heart className={t.valuesClassName} />,
    users: <Users className={t.valuesClassName} />,
    globe: <Globe className={t.valuesClassName} />,
  };

  return (
    <Section background="neutral">
      {/* Mission / Objective / Goal */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-8 h-0.5 bg-primary-400" />
          <span className="text-primary-500 text-sm font-semibold tracking-widest uppercase">
            {t.missionEyebrow}
          </span>
          <div className="w-8 h-0.5 bg-primary-400" />
        </div>
        <h2 className="font-display text-3xl font-bold text-neutral-900">
          {t.missionHeading}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
        {[t.mission, t.objective, t.goal].map((item) => (
          <HoepCard key={item.title} className="text-center">
            <div className="text-4xl mb-4">{item.icon}</div>
            <h3 className="font-display font-bold text-neutral-900 text-lg mb-3">
              {item.title}
            </h3>
            <p className="text-neutral-500 text-sm leading-relaxed">
              {item.body}
            </p>
          </HoepCard>
        ))}
      </div>

      {/* Values */}
      <div className="text-center mb-12">
        <h2 className="font-display text-3xl font-bold text-neutral-900">
          {t.valuesHeading}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {t.values.map((value) => {
          return <ValueCard key={value.title} {...value} config={iconConfig} />;
        })}
      </div>
    </Section>
  );
}

function ValueCard({
  icon,
  title,
  body,
  config,
}: {
  icon: string;
  title: string;
  body: string;
  config: Record<string, React.ReactNode>;
}) {
  const iconElement = config[icon];
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-neutral-200 hover:border-primary-200 hover:shadow-md transition-all duration-200">
      <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center text-primary mb-4">
        {iconElement}
      </div>
      <h3 className="font-display font-bold text-neutral-900 mb-2">{title}</h3>
      <p className="text-sm text-neutral-500 leading-relaxed">{body}</p>
    </div>
  );
}
