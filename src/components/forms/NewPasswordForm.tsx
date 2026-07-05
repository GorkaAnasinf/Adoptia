"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PasswordField } from "./PasswordField";
import { nuevaPasswordSchema, type NuevaPasswordInput } from "@/lib/schemas/auth";
import { createClient } from "@/lib/supabase/client";

export function NewPasswordForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [serverError, setServerError] = useState(false);

  const form = useForm<NuevaPasswordInput>({
    resolver: zodResolver(nuevaPasswordSchema),
    defaultValues: { password: "" },
  });

  async function onSubmit(values: NuevaPasswordInput) {
    setServerError(false);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });
    if (error) {
      setServerError(true);
      return;
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex w-full max-w-sm flex-col gap-4"
      noValidate
    >
      <PasswordField
        value={form.watch("password")}
        error={Boolean(form.formState.errors.password)}
        showStrength
        autoComplete="new-password"
        inputProps={form.register("password")}
      />

      {serverError && (
        <p role="alert" className="text-sm text-destructive">
          {t("genericError")}
        </p>
      )}

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {t("newPasswordSubmit")}
      </Button>
    </form>
  );
}
