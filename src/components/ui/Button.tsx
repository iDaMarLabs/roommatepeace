import { ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

type ButtonVariant = "primary" | "ghost" | "ghost-emerald";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  fullWidth = false,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={twMerge(
        clsx(
          "py-2.5 px-4 font-medium rounded-lg transition-colors text-sm",
          fullWidth && "w-full",
          variant === "primary" &&
            "bg-emerald-500 hover:bg-emerald-600 text-white disabled:bg-stone-200 disabled:text-stone-400",
          variant === "ghost" &&
            "border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 disabled:opacity-50",
          variant === "ghost-emerald" &&
            "border border-emerald-500 bg-white hover:bg-emerald-50 text-emerald-600 disabled:opacity-50",
          className
        )
      )}
      {...props}
    >
      {children}
    </button>
  );
}
