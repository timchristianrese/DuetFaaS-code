import { z } from "zod";

const lambdaSchema = z.object({
  entry: z.string(),
});

export const configSchema = z.object({
  lambda_a: lambdaSchema,
  lambda_b: lambdaSchema,
});

export type Config = z.TypeOf<typeof configSchema>;
