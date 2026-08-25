import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { tokens } from "@/theme/tokens";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E76120] disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer active:scale-[0.99]",
  {
    variants: {
      variant: {
        // NFI Figma Primary Login Yellow Button (#FFD243)
        nfiYellow:
          "bg-[#FFD243] text-[#1E293B] shadow-sm hover:brightness-95 hover:bg-[#F5C422]",
        // NFI Brand Orange Button (#E76120)
        nfiOrange:
          "bg-[#E76120] text-white shadow-sm hover:bg-[#D45517]",
        // NFI Brand Navy Button (#284661)
        nfiNavy:
          "bg-[#284661] text-white shadow-sm hover:bg-[#1B3145]",
        // Standard shadcn variants with brand compatibility
        default:
          "bg-[#E76120] text-white shadow-sm hover:bg-[#D45517]",
        destructive:
          "bg-red-500 text-white shadow-sm hover:bg-red-600",
        outline:
          "border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 hover:text-slate-900",
        secondary:
          "bg-[#284661] text-white shadow-sm hover:bg-[#1B3145]",
        ghost:
          "hover:bg-slate-100 hover:text-slate-900",
        link:
          "text-[#E76120] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-[44px] px-4 py-2",
        sm: "h-9 rounded-[6px] px-3 text-xs",
        lg: "h-12 rounded-[8px] px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "nfiYellow",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
export default Button;
