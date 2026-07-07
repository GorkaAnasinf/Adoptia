import { AppShell } from "@/components/layout/AppShell";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AppShell role="admin" onboarding={false} status={null}>
      {children}
    </AppShell>
  );
}
