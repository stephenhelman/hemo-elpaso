"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import StepIndicator from "@/components/portal/register/StepIndicator";
import BasicInfoStep from "@/components/portal/register/BasicInfoStep";
import DiagnosisStep from "@/components/portal/register/DiagnosisStep";
import FamilyMembersStep from "@/components/portal/register/FamilyMembersStep";
import EmergencyContactStep from "@/components/portal/register/EmergencyContactStep";
import PreferencesStep from "@/components/portal/register/PreferencesStep";
import ConsentStep from "@/components/portal/register/ConsentStep";

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/portal/dashboard";
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    phone: "",
    address: "",
    city: "",
    state: "TX",
    zipCode: "",

    // Step 2: Diagnosis
    primaryCondition: "",
    severity: "",
    diagnosisDate: "",
    treatingPhysician: "",
    specialtyPharmacy: "",
    diagnosisLetterFile: null as File | null, // ADD THIS

    // Step 3: Family Members
    familyMembers: [] as Array<{
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      relationship: string;
      hasBleedingDisorder: boolean;
      condition?: string;
      severity?: string;
    }>,

    // Step 4: Emergency Contact
    emergencyName: "",
    emergencyRelationship: "",
    emergencyPhone: "",

    // Step 5: Preferences
    interestedTopics: [] as string[],
    preferredEventTimes: [] as string[],
    maxTravelDistance: 30,
    dietaryRestrictions: [] as string[],
    accessibilityNeeds: "",
    emailNotifications: true,
    smsNotifications: false,
    languagePreference: "en",

    // Step 6: Consent
    hipaaConsent: false,
    photoConsent: false,
    communicationConsent: false,
  });

  const totalSteps = 6;

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    try {
      // CREATE FORMDATA OBJECT
      const formDataToSend = new FormData();

      // Add all fields EXCEPT diagnosisLetterFile
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "diagnosisLetterFile") {
          // Skip - we'll add it separately
          return;
        }

        if (
          key === "familyMembers" ||
          key === "interestedTopics" ||
          key === "preferredEventTimes" ||
          key === "dietaryRestrictions"
        ) {
          // Stringify arrays/objects
          formDataToSend.append(key, JSON.stringify(value));
        } else if (value !== null && value !== undefined) {
          formDataToSend.append(key, String(value));
        }
      });

      // Add diagnosis letter file if exists
      if (formData.diagnosisLetterFile) {
        formDataToSend.append("diagnosisLetter", formData.diagnosisLetterFile);
      }

      const response = await fetch("/api/patient/register", {
        method: "POST",
        // DON'T set Content-Type - browser will set it with proper boundary
        body: formDataToSend,
      });

      if (response.ok) {
        toast.success("Registration complete! Welcome to HOEP!");
        router.push(callbackUrl);
      } else {
        const data = await response.json();
        toast.error(data.error || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
            Complete Your Patient Profile
          </h1>
          <p className="text-neutral-500">
            This information helps us provide personalized support and event
            recommendations.
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />

        {/* Form Steps */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8 mt-8">
          {currentStep === 1 && (
            <BasicInfoStep
              data={formData}
              updateData={updateFormData}
              onNext={nextStep}
            />
          )}
          {currentStep === 2 && (
            <DiagnosisStep
              data={formData}
              updateData={updateFormData}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          {currentStep === 3 && (
            <FamilyMembersStep
              data={formData}
              updateData={updateFormData}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          {currentStep === 4 && (
            <EmergencyContactStep
              data={formData}
              updateData={updateFormData}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          {currentStep === 5 && (
            <PreferencesStep
              data={formData}
              updateData={updateFormData}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          {currentStep === 6 && (
            <ConsentStep
              data={formData}
              updateData={updateFormData}
              onSubmit={handleSubmit}
              onBack={prevStep}
            />
          )}
        </div>

        {/* Privacy Notice */}
        <p className="text-center text-xs text-neutral-400 mt-6">
          🔒 All information is encrypted and HIPAA-compliant. Your data is
          never shared without your explicit consent.
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterPageContent />
    </Suspense>
  );
}
