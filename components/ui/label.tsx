// components/ui/label.tsx
import { cn } from "@/lib/utils" // Ensure this utility exists in your project

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium", className)} {...props} />;
}
