import { AppShell } from "@/components/layout/AppShell";

export default function AdopterLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AppShell role="adopter" onboarding={false} status={null}>
      {children}
    </AppShell>
  );
}
