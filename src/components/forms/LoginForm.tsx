"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Captcha, captchaHabilitado } from "./Captcha";
import { PasswordField } from "./PasswordField";
import { loginSchema, type LoginInput } from "@/lib/schemas/auth";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setServerError(false);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      ...values,
      ...(captchaToken ? { options: { captchaToken } } : {}),
    });
    if (error) {
      // Mensaje genérico: no revelar si el email existe
      setServerError(true);
      setCaptchaKey((k) => k + 1); // token consumido: pedir uno nuevo
      setCaptchaToken("");
      return;
    }
    // Solo rutas internas: evitar open redirect (?redirect=https://evil.com)
    const destino = searchParams.get("redirect") ?? "/";
    router.push(destino.startsWith("/") && !destino.startsWith("//") ? destino : "/");
    router.refresh();
  }

  const errors = form.formState.errors;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex w-full flex-col gap-5"
      noValidate
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...form.register("email")}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive">
            {t("errorEmailInvalid")}
          </p>
        )}
      </div>

      <PasswordField
        value={form.watch("password")}
        error={Boolean(errors.password)}
        errorText={t("errorPasswordMin")}
        autoComplete="current-password"
        inputProps={form.register("password")}
        labelEnd={
          <Link
            href="/recuperar"
            className="text-sm font-medium text-primary hover:underline"
          >
            {t("forgotPassword")}
          </Link>
        }
      />

      <Captcha onVerify={setCaptchaToken} resetSignal={captchaKey} />

      {serverError && (
        <p role="alert" className="text-sm text-destructive">
          {t("genericError")}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={
          form.formState.isSubmitting || (captchaHabilitado && !captchaToken)
        }
      >
        {t("submitLogin")}
        <ArrowRight />
      </Button>
    </form>
  );
}
