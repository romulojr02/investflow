import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-zinc-100 text-zinc-700",
        paid: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        pending: "bg-amber-50 text-amber-700 border border-amber-200",
        overdue: "bg-rose-50 text-rose-700 border border-rose-200",
        high: "bg-rose-50 text-rose-700 border border-rose-200",
        medium: "bg-amber-50 text-amber-700 border border-amber-200",
        low: "bg-zinc-100 text-zinc-600 border border-zinc-200",
        rm: "bg-indigo-50 text-indigo-700 border border-indigo-200",
        investor: "bg-sky-50 text-sky-700 border border-sky-200",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
