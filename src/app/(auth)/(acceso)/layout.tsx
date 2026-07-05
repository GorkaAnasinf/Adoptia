import { AuthSplit } from "@/components/layout/AuthSplit";

export default function AccesoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AuthSplit image="/images/auth-login.jpg">{children}</AuthSplit>;
}
