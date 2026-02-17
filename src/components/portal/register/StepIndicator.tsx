import { Check } from "lucide-react";

interface Props {
  currentStep: number;
  totalSteps: number;
}

const stepLabels = ["Basic Info", "Diagnosis", "Emergency Contact", "Consent"];

export default function StepIndicator({ currentStep, totalSteps }: Props) {
  return (
    <div className="flex items-center">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;

        return (
          <div key={stepNumber} className="flex items-center flex-1">
            {/* Step circle */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                  isCompleted
                    ? "bg-primary text-white"
                    : isCurrent
                      ? "bg-primary text-white ring-4 ring-primary/20"
                      : "bg-neutral-200 text-neutral-400"
                }`}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : stepNumber}
              </div>
              <p
                className={`text-xs mt-2 font-medium whitespace-nowrap ${
                  isCurrent ? "text-primary" : "text-neutral-400"
                }`}
              >
                {stepLabels[index]}
              </p>
            </div>

            {/* Connecting line */}
            {index < totalSteps - 1 && (
              <div
                className={`h-0.5 transition-colors ${
                  stepNumber < currentStep ? "bg-primary" : "bg-neutral-200"
                } flex-1 -mx-2`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
