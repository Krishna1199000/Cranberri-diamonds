// components/ui/label.tsx
import * as React from "react";
import { cn } from "@/lib/utils" // Ensure this utility exists in your project

// Wrap the Label component with React.forwardRef
const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => {
  return <label ref={ref} className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)} {...props} />;
});
Label.displayName = "Label";

export { Label }; // Export the wrapped component
