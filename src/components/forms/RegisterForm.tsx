"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Home, PawPrint } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Captcha, captchaHabilitado } from "./Captcha";
import { PasswordField } from "./PasswordField";
import { registroSchema, type RegistroInput } from "@/lib/schemas/auth";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function RegisterForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [serverError, setServerError] = useState(false);
  const [maybeRegistered, setMaybeRegistered] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);

  const form = useForm<RegistroInput>({
    resolver: zodResolver(registroSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      role: "adopter",
      acceptTerms: undefined as unknown as true,
    },
  });

  const role = form.watch("role");
  const password = form.watch("password");
  const errors = form.formState.errors;

  async function onSubmit(values: RegistroInput) {
    setServerError(false);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.fullName, role: values.role },
        ...(captchaToken ? { captchaToken } : {}),
      },
    });
    if (error) {
      // Mensaje genérico: no revelar si el email ya existe
      setServerError(true);
      setCaptchaKey((k) => k + 1);
      setCaptchaToken("");
      return;
    }
    // Anti-enumeración de Supabase: email ya registrado => "usuario" sin identities.
    // Mensaje neutro que guía a login/recuperar sin confirmar que la cuenta existe.
    if (data.user && data.user.identities?.length === 0) {
      setMaybeRegistered(true);
      return;
    }
    if (data.session) {
      router.push(values.role === "shelter" ? "/panel" : "/");
      router.refresh();
    } else {
      router.push("/confirma-correo");
    }
  }

  const tipos = [
    {
      valor: "adopter" as const,
      etiqueta: t("typeAdopter"),
      ayuda: t("typeAdopterHelp"),
      Icono: PawPrint,
    },
    {
      valor: "shelter" as const,
      etiqueta: t("typeShelter"),
      ayuda: t("typeShelterHelp"),
      Icono: Home,
    },
  ];

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex w-full max-w-md flex-col gap-6"
      noValidate
    >
      {/* Selector de tipo de cuenta (wireframe: dos tarjetas) */}
      <div role="radiogroup" aria-label={t("registerSubtitle")} className="grid grid-cols-2 gap-4">
        {tipos.map(({ valor, etiqueta, ayuda, Icono }) => {
          const activo = role === valor;
          return (
            <button
              key={valor}
              type="button"
              role="radio"
              aria-checked={activo}
              onClick={() => form.setValue("role", valor)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border-2 p-5 text-center transition-colors",
                activo
                  ? "border-primary bg-primary/10"
                  : "border-transparent bg-card shadow-sm hover:bg-accent",
              )}
            >
              <span
                className={cn(
                  "flex size-12 items-center justify-center rounded-full",
                  activo ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                <Icono className="size-6" />
              </span>
              <span className="text-sm font-medium">{etiqueta}</span>
              <span className="text-xs leading-snug text-muted-foreground">{ayuda}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 rounded-xl bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <Label htmlFor="fullName">{t("fullName")}</Label>
          <Input
            id="fullName"
            autoComplete="name"
            placeholder={t("fullNamePlaceholder")}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? "fullName-error" : undefined}
            {...form.register("fullName")}
          />
          {errors.fullName && (
            <p id="fullName-error" className="text-sm text-destructive">
              {t("errorNameRequired")}
            </p>
          )}
        </div>

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
          {errors.email ? (
            <p id="email-error" className="text-sm text-destructive">
              {t("errorEmailInvalid")}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">{t("emailHelp")}</p>
          )}
        </div>

        <PasswordField
          value={password}
          error={Boolean(errors.password)}
          errorText={t("errorPasswordWeak")}
          showStrength
          autoComplete="new-password"
          inputProps={form.register("password")}
        />

        <div className="flex flex-col gap-1">
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 size-4 rounded-sm accent-[var(--primary)]"
              aria-invalid={Boolean(errors.acceptTerms)}
              {...form.register("acceptTerms")}
            />
            <span>
              {t("acceptTermsStart")}{" "}
              <Link href="/terminos" className="font-medium text-primary hover:underline">
                {t("termsLink")}
              </Link>{" "}
              {t("acceptTermsAnd")}{" "}
              <Link href="/privacidad" className="font-medium text-primary hover:underline">
                {t("privacyLink")}
              </Link>
              .
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="text-sm text-destructive">{t("acceptTermsError")}</p>
          )}
        </div>

        {serverError && (
          <p role="alert" className="text-sm text-destructive">
            {t("genericError")}
          </p>
        )}
        {maybeRegistered && (
          <p role="status" className="text-sm text-foreground">
            {t("maybeRegistered")}{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              {t("loginTitle")}
            </Link>{" "}
            ·{" "}
            <Link href="/recuperar" className="font-medium text-primary hover:underline">
              {t("forgotPassword")}
            </Link>
          </p>
        )}

        <Captcha onVerify={setCaptchaToken} resetSignal={captchaKey} />

        <Button
          type="submit"
          size="lg"
          disabled={
            form.formState.isSubmitting || (captchaHabilitado && !captchaToken)
          }
        >
          {t("submitRegister")}
        </Button>
      </div>
    </form>
  );
}
