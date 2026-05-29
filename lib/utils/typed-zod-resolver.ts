import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldValues, Resolver } from "react-hook-form";
import type { ZodType } from "zod";

/** Bridges Zod input/output inference gaps with react-hook-form (coerce, default, nullable). */
export function typedZodResolver<T extends FieldValues>(
  schema: ZodType<T, FieldValues, FieldValues>
): Resolver<T> {
  return zodResolver(schema) as Resolver<T>;
}
