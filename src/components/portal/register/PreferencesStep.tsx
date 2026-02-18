"use client";

import {
  Heart,
  Clock,
  MapPin,
  Utensils,
  Accessibility,
  Bell,
  Globe,
} from "lucide-react";

interface Props {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

const eventTopics = [
  { value: "EDUCATION", label: "Educational Seminars", icon: "📚" },
  { value: "SOCIAL", label: "Social Events", icon: "🎉" },
  { value: "FUNDRAISING", label: "Fundraising Events", icon: "💰" },
  { value: "ADVOCACY", label: "Advocacy & Awareness", icon: "📢" },
  { value: "YOUTH", label: "Youth Programs", icon: "👦" },
  { value: "FAMILY_SUPPORT", label: "Family Support Groups", icon: "👨‍👩‍👧‍👦" },
  { value: "MEDICAL_UPDATE", label: "Medical Updates", icon: "⚕️" },
  {
    value: "FINANCIAL_ASSISTANCE",
    label: "Financial Assistance Info",
    icon: "💵",
  },
];

const eventTimes = [
  { value: "weekday_morning", label: "Weekday Mornings" },
  { value: "weekday_afternoon", label: "Weekday Afternoons" },
  { value: "weekday_evening", label: "Weekday Evenings" },
  { value: "weekend_morning", label: "Weekend Mornings" },
  { value: "weekend_afternoon", label: "Weekend Afternoons" },
  { value: "weekend_evening", label: "Weekend Evenings" },
];

const dietaryOptions = [
  { value: "NONE", label: "No restrictions" },
  { value: "VEGETARIAN", label: "Vegetarian" },
  { value: "VEGAN", label: "Vegan" },
  { value: "GLUTEN_FREE", label: "Gluten-Free" },
  { value: "DAIRY_FREE", label: "Dairy-Free" },
  { value: "NUT_ALLERGY", label: "Nut Allergy" },
  { value: "HALAL", label: "Halal" },
  { value: "KOSHER", label: "Kosher" },
  { value: "OTHER", label: "Other (specify in accessibility)" },
];

export default function PreferencesStep({
  data,
  updateData,
  onNext,
  onBack,
}: Props) {
  const toggleTopic = (topic: string) => {
    const current = data.interestedTopics || [];
    if (current.includes(topic)) {
      updateData({
        interestedTopics: current.filter((t: string) => t !== topic),
      });
    } else {
      updateData({ interestedTopics: [...current, topic] });
    }
  };

  const toggleTime = (time: string) => {
    const current = data.preferredEventTimes || [];
    if (current.includes(time)) {
      updateData({
        preferredEventTimes: current.filter((t: string) => t !== time),
      });
    } else {
      updateData({ preferredEventTimes: [...current, time] });
    }
  };

  const toggleDietary = (restriction: string) => {
    const current = data.dietaryRestrictions || [];

    // If selecting NONE, clear all others
    if (restriction === "NONE") {
      updateData({ dietaryRestrictions: ["NONE"] });
      return;
    }

    // If selecting anything else, remove NONE
    const filtered = current.filter((r: string) => r !== "NONE");

    if (filtered.includes(restriction)) {
      updateData({
        dietaryRestrictions: filtered.filter((r: string) => r !== restriction),
      });
    } else {
      updateData({ dietaryRestrictions: [...filtered, restriction] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="font-display font-bold text-neutral-900 text-xl mb-1">
          Event Preferences
        </h2>
        <p className="text-neutral-500 text-sm">
          Help us recommend events that match your interests and availability.
        </p>
      </div>

      {/* Event Topics */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-4 h-4 text-primary" />
          <label className="text-sm font-semibold text-neutral-700">
            What types of events interest you?
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {eventTopics.map((topic) => (
            <button
              key={topic.value}
              type="button"
              onClick={() => toggleTopic(topic.value)}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                data.interestedTopics?.includes(topic.value)
                  ? "border-primary bg-primary-50 text-primary"
                  : "border-neutral-200 hover:border-primary-200"
              }`}
            >
              <span className="text-2xl">{topic.icon}</span>
              <span className="text-sm font-medium">{topic.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Preferred Event Times */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-primary" />
          <label className="text-sm font-semibold text-neutral-700">
            When can you typically attend? (Select all that apply)
          </label>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {eventTimes.map((time) => (
            <button
              key={time.value}
              type="button"
              onClick={() => toggleTime(time.value)}
              className={`p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                data.preferredEventTimes?.includes(time.value)
                  ? "border-primary bg-primary-50 text-primary"
                  : "border-neutral-200 hover:border-primary-200"
              }`}
            >
              {time.label}
            </button>
          ))}
        </div>
      </div>

      {/* Travel Distance */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-primary" />
          <label className="text-sm font-semibold text-neutral-700">
            Maximum travel distance: {data.maxTravelDistance || 30} miles
          </label>
        </div>
        <input
          type="range"
          min="5"
          max="100"
          step="5"
          value={data.maxTravelDistance || 30}
          onChange={(e) =>
            updateData({ maxTravelDistance: parseInt(e.target.value) })
          }
          className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-xs text-neutral-400 mt-1">
          <span>5 mi</span>
          <span>100 mi</span>
        </div>
      </div>

      {/* Dietary Restrictions */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Utensils className="w-4 h-4 text-primary" />
          <label className="text-sm font-semibold text-neutral-700">
            Dietary restrictions (Select all that apply)
          </label>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {dietaryOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleDietary(option.value)}
              className={`p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                data.dietaryRestrictions?.includes(option.value)
                  ? "border-primary bg-primary-50 text-primary"
                  : "border-neutral-200 hover:border-primary-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accessibility Needs */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Accessibility className="w-4 h-4 text-primary" />
          <label className="text-sm font-semibold text-neutral-700">
            Accessibility needs
          </label>
        </div>
        <textarea
          value={data.accessibilityNeeds || ""}
          onChange={(e) => updateData({ accessibilityNeeds: e.target.value })}
          placeholder="Wheelchair access, ASL interpreter, parking assistance, etc."
          rows={3}
          className={inputClass}
        />
      </div>

      {/* Communication Preferences */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4 text-primary" />
          <label className="text-sm font-semibold text-neutral-700">
            How would you like to receive notifications?
          </label>
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 hover:border-primary-200 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={data.emailNotifications}
              onChange={(e) =>
                updateData({ emailNotifications: e.target.checked })
              }
              className="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium text-neutral-700">
              Email notifications
            </span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 hover:border-primary-200 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={data.smsNotifications}
              onChange={(e) =>
                updateData({ smsNotifications: e.target.checked })
              }
              className="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium text-neutral-700">
              SMS/Text notifications
            </span>
          </label>
        </div>
      </div>

      {/* Language Preference */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-primary" />
          <label className="text-sm font-semibold text-neutral-700">
            Preferred language for communications
          </label>
        </div>
        <select
          value={data.languagePreference || "en"}
          onChange={(e) => updateData({ languagePreference: e.target.value })}
          className={inputClass}
        >
          <option value="en">English</option>
          <option value="es">Español (Spanish)</option>
        </select>
      </div>

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

const inputClass = `
  w-full px-4 py-2.5 rounded-xl border border-neutral-200
  text-neutral-900 text-sm placeholder:text-neutral-400
  focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
  transition-colors resize-none
`.trim();
