// Check if user has completed onboarding
export const hasCompletedOnboarding = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('onboardingComplete') === 'true';
};

// Mark onboarding as complete
export const completeOnboarding = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('onboardingComplete', 'true');
  }
};

// Clear onboarding status (for logout)
export const clearOnboardingStatus = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('onboardingComplete');
  }
};
