import { AuthSplit } from "@/components/layout/AuthSplit";

export default function VerificadoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AuthSplit image="/images/auth-verified.jpg">{children}</AuthSplit>;
}
