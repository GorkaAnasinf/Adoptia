"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { passwordStrength } from "@/lib/password";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  error?: boolean;
  showStrength?: boolean;
  autoComplete: string;
  inputProps: React.InputHTMLAttributes<HTMLInputElement>;
};

export function PasswordField({
  value,
  error,
  showStrength = false,
  autoComplete,
  inputProps,
}: Props) {
  const t = useTranslations("auth");
  const [visible, setVisible] = useState(false);
  const strength = passwordStrength(value);

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="password">{t("password")}</Label>
      <div className="relative">
        <Input
          id="password"
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          className="pr-10"
          aria-invalid={error}
          aria-describedby={error ? "password-error" : "password-hint"}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t("hidePassword") : t("showPassword")}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {showStrength && (
        <>
          <div
            data-testid="password-strength"
            data-strength={strength}
            aria-hidden="true"
            className="grid grid-cols-3 gap-2"
          >
            {[1, 2, 3].map((nivel) => (
              <div
                key={nivel}
                className={cn(
                  "h-1 rounded-full bg-muted",
                  strength >= nivel &&
                    (strength === 1
                      ? "bg-destructive"
                      : strength === 2
                        ? "bg-primary-container"
                        : "bg-tertiary"),
                )}
              />
            ))}
          </div>
          <p id="password-hint" className="text-xs text-muted-foreground">
            {t("passwordHint")}
          </p>
        </>
      )}
      {error && (
        <p id="password-error" className="text-sm text-destructive">
          {t("passwordHint")}
        </p>
      )}
    </div>
  );
}
