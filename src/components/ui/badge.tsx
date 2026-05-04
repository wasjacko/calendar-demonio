import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground border-border",
        tofu: "border-transparent bg-tofu text-tofu-foreground",
        mofu: "border-transparent bg-mofu text-mofu-foreground",
        bofu: "border-transparent bg-bofu text-bofu-foreground",
        idea: "border-dashed border-status-idea text-status-idea bg-transparent",
        draft: "border-transparent bg-status-draft/15 text-status-draft",
        scheduled: "border-transparent bg-status-scheduled/15 text-status-scheduled",
        published: "border-transparent bg-status-published/15 text-status-published",
        missed: "border-transparent bg-status-missed/15 text-status-missed",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
