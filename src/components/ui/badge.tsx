import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background",
        secondary: "bg-muted text-foreground",
        outline: "border border-border text-foreground bg-transparent",
        // Notion-style tinted tags : faible saturation
        expert: "bg-expert/10 text-expert dark:bg-expert/20",
        audience: "bg-audience/10 text-audience dark:bg-audience/20",
        attachement: "bg-attachement/10 text-attachement dark:bg-attachement/20",
        valeur: "bg-valeur/10 text-valeur dark:bg-valeur/20",
        audience_valeur: "bg-audience-valeur/10 text-audience-valeur dark:bg-audience-valeur/20",
        idea: "bg-muted text-muted-foreground",
        draft: "bg-muted text-muted-foreground",
        scheduled: "bg-muted text-foreground",
        published: "bg-status-published/10 text-status-published",
        missed: "bg-destructive/10 text-destructive",
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
