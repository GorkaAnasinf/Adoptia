import { AuthSplit } from "@/components/layout/AuthSplit";

export default function AltaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AuthSplit image="/images/auth-register.jpg">{children}</AuthSplit>;
}
