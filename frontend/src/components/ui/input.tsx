import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-xl border border-slate-200/80 bg-brand-abyss/30 px-3 py-1 text-base text-brand-silver shadow-sm transition-colors",
          "placeholder:text-brand-platinum focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-electric/50",
          "dark:border-white/10 dark:bg-brand-void/50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
