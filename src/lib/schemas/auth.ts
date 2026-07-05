import { z } from "zod";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

// Contraseña de alta: mínimo 8 con letras y números
const passwordFuerte = z
  .string()
  .min(8)
  .regex(/[a-záéíóúñü]/i)
  .regex(/\d/);

// Solo adopter/shelter en registro — admin jamás autoservicio
export const registroSchema = loginSchema.extend({
  password: passwordFuerte,
  fullName: z.string().trim().min(1),
  role: z.enum(["adopter", "shelter"]),
  acceptTerms: z.literal(true),
});

export const recuperarSchema = z.object({
  email: z.email(),
});

export const nuevaPasswordSchema = z.object({
  password: passwordFuerte,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegistroInput = z.infer<typeof registroSchema>;
export type RecuperarInput = z.infer<typeof recuperarSchema>;
export type NuevaPasswordInput = z.infer<typeof nuevaPasswordSchema>;
