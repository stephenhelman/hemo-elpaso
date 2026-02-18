"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StepIndicator from "@/components/portal/register/StepIndicator";
import BasicInfoStep from "@/components/portal/register/BasicInfoStep";
import DiagnosisStep from "@/components/portal/register/DiagnosisStep";
import FamilyMembersStep from "@/components/portal/register/FamilyMembersStep";
import EmergencyContactStep from "@/components/portal/register/EmergencyContactStep";
import PreferencesStep from "@/components/portal/register/PreferencesStep";
import ConsentStep from "@/components/portal/register/ConsentStep";

export default function RegisterPage() {
  const router = useRouter();
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
      const response = await fetch("/api/patient/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push("/portal/dashboard");
      } else {
        alert("Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("An error occurred. Please try again.");
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
