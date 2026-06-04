// Shared Clerk appearance so the sign-in and sign-up pages match the
// Resolve dark zinc design used across the app (see app/incidents/page.tsx).
// Typed structurally by the `appearance` prop on <SignIn>/<SignUp>.
export const clerkAppearance = {
  variables: {
    colorPrimary: "#ffffff",
    colorBackground: "#0a0a0a",
    colorText: "#fafafa",
    colorTextSecondary: "#a1a1aa",
    colorInputBackground: "#18181b",
    colorInputText: "#fafafa",
    colorNeutral: "#fafafa",
    borderRadius: "0.5rem",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  elements: {
    rootBox: "flex w-full justify-center",
    card: "bg-zinc-900 border border-zinc-800 shadow-xl",
    headerTitle: "text-white",
    headerSubtitle: "text-zinc-400",
    socialButtonsBlockButton:
      "border border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700",
    dividerLine: "bg-zinc-800",
    dividerText: "text-zinc-500",
    formFieldLabel: "text-zinc-300",
    formFieldInput:
      "bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500",
    formButtonPrimary:
      "bg-white text-black hover:bg-zinc-200 text-sm normal-case font-medium",
    footerActionText: "text-zinc-500",
    footerActionLink: "text-white hover:text-zinc-300",
    identityPreviewText: "text-zinc-300",
    formFieldInputShowPasswordButton: "text-zinc-400 hover:text-white",
  },
};
