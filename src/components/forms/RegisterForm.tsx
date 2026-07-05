"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registroSchema, type RegistroInput } from "@/lib/schemas/auth";
import { createClient } from "@/lib/supabase/client";

export function RegisterForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [serverError, setServerError] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  const form = useForm<RegistroInput>({
    resolver: zodResolver(registroSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  async function onSubmit(values: RegistroInput) {
    setServerError(false);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.fullName, role: "adopter" },
      },
    });
    if (error) {
      setServerError(true);
      return;
    }
    if (data.session) {
      router.push("/");
      router.refresh();
    } else {
      // Confirmación por email activada
      setCheckEmail(true);
    }
  }

  const errors = form.formState.errors;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex w-full max-w-sm flex-col gap-4"
      noValidate
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="fullName">{t("fullName")}</Label>
        <Input
          id="fullName"
          autoComplete="name"
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={errors.fullName ? "fullName-error" : undefined}
          {...form.register("fullName")}
        />
        {errors.fullName && (
          <p id="fullName-error" className="text-sm text-destructive">
            {t("genericError")}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...form.register("email")}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive">
            {t("genericError")}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...form.register("password")}
        />
        {errors.password && (
          <p id="password-error" className="text-sm text-destructive">
            {t("genericError")}
          </p>
        )}
      </div>

      {serverError && (
        <p role="alert" className="text-sm text-destructive">
          {t("genericError")}
        </p>
      )}
      {checkEmail && (
        <p role="status" className="text-sm text-tertiary">
          {t("checkEmail")}
        </p>
      )}

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {t("submitRegister")}
      </Button>
    </form>
  );
}
