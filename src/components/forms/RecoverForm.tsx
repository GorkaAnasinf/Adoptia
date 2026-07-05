"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recuperarSchema, type RecuperarInput } from "@/lib/schemas/auth";
import { createClient } from "@/lib/supabase/client";

export function RecoverForm() {
  const t = useTranslations("auth");
  const [enviado, setEnviado] = useState(false);

  const form = useForm<RecuperarInput>({
    resolver: zodResolver(recuperarSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: RecuperarInput) {
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/actualizar-password`,
    });
    // Mismo mensaje haya o no cuenta: no revelar existencia del email
    setEnviado(true);
  }

  const errors = form.formState.errors;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex w-full max-w-sm flex-col gap-4"
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
          {...form.register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{t("genericError")}</p>
        )}
      </div>

      {enviado && (
        <p role="status" className="text-sm text-tertiary">
          {t("recoverSent")}
        </p>
      )}

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {t("recoverSubmit")}
      </Button>
    </form>
  );
}
