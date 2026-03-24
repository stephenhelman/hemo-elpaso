"use client";

import { Suspense, useState, useEffect } from "react";
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
  const inviteMembershipId = searchParams.get("invite") || "";
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
    wantsToVolunteer: false,
  });

  const totalSteps = 6;
  const STORAGE_KEY = "hoep_registration";
  const STEP_KEY = "hoep_registration_step";

  // Restore from sessionStorage on mount
  useEffect(() => {
    try {
      const savedData = sessionStorage.getItem(STORAGE_KEY);
      const savedStep = sessionStorage.getItem(STEP_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        // diagnosisLetterFile is a File — cannot be serialized, omit on restore
        setFormData((prev) => ({ ...prev, ...parsed, diagnosisLetterFile: null }));
      }
      if (savedStep) {
        setCurrentStep(parseInt(savedStep, 10));
      }
    } catch {
      // Ignore parse errors — start fresh
    }
  }, []);

  // Pre-fill from volunteer form data (track B YES branch — hasBDConnection)
  useEffect(() => {
    try {
      const volunteerData = sessionStorage.getItem("volunteerFormData");
      if (!volunteerData) return;
      const parsed = JSON.parse(volunteerData);
      // Split name into firstName / lastName
      const nameParts = (parsed.name || "").trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      setFormData((prev) => ({
        ...prev,
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(parsed.phone && { phone: parsed.phone }),
        wantsToVolunteer: true,
      }));
    } catch {
      // Ignore
    }
  }, []);

  // Persist to sessionStorage whenever formData or step changes
  useEffect(() => {
    try {
      const { diagnosisLetterFile, ...saveable } = formData;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(saveable));
    } catch {
      // Ignore storage errors (private browsing, quota)
    }
  }, [formData]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STEP_KEY, String(currentStep));
    } catch {
      // Ignore
    }
  }, [currentStep]);

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

      // Pass invite membership id if present
      if (inviteMembershipId) {
        formDataToSend.append("inviteMembershipId", inviteMembershipId);
      }

      const response = await fetch("/api/patient/register", {
        method: "POST",
        // DON'T set Content-Type - browser will set it with proper boundary
        body: formDataToSend,
      });

      if (response.ok) {
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(STEP_KEY);
        sessionStorage.removeItem("volunteerFormData");
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
            <FamilyMembersStep
              data={formData}
              updateData={updateFormData}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          {currentStep === 3 && (
            <DiagnosisStep
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
