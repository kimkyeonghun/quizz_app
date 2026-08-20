import { z } from "zod";

export const difficultySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

export const assetLicenseSchema = z.enum(["ORIGINAL", "CC0-1.0", "CC-BY-4.0"]);

export const commonQuestionShape = {
  id: z.string().min(1),
  answer: z.string().min(1).nullable(),
  acceptedAnswers: z.array(z.string().min(1)).optional(),
  category: z.string().min(1),
  subcategory: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)).optional(),
  difficulty: difficultySchema,
  enabled: z.boolean(),
  verified: z.boolean(),
  asset: z.string().min(1).nullable().optional(),
  source: z.string().min(1).nullable().optional(),
  notes: z.string().optional(),
  createdAt: z.string().optional(),
  version: z.number().int().min(1).optional(),
};

export const mediaCreditShape = {
  license: assetLicenseSchema,
  credit: z.string().min(1),
};

export const positiveInteger = z.number().int().positive();
