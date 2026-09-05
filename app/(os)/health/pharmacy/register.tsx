// @ts-nocheck
import React from 'react';
import FacilityRegistrationScreen from '../facility-register/index';

// Pharmacy onboarding reuses the facility registration flow (type defaults to pharmacy).
export default function PharmacyRegisterScreen() {
  return <FacilityRegistrationScreen />;
}
