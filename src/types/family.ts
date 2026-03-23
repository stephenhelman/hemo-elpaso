export interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  relationship: string;
  ageTier: string; // RECORD_ONLY | YOUTH | ADULT
  status: string;  // ACTIVE | PENDING_INVITE | DETACHED
  hasBleedingDisorder: boolean;
}
