export const onboardingKeys = {
  all: ["onboarding"] as const,
  profile: () => [...onboardingKeys.all, "profile"] as const,
};
