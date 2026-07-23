import { z } from "zod";

/** Testimonio del adoptante sobre un animal que adoptó (FEATURE-059). */
export const historiaSchema = z.object({
  animal_id: z.uuid(),
  quote: z.string().trim().min(10).max(600),
  photo_url: z.url().optional(),
  consent: z.literal(true),
});

export type Historia = z.infer<typeof historiaSchema>;

export const ESTADOS_HISTORIA = ["pending", "approved", "rejected"] as const;
export type EstadoHistoria = (typeof ESTADOS_HISTORIA)[number];
