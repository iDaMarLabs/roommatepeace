"use client";

import { InputHTMLAttributes, useId } from "react";
import { clsx } from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  const id = useId();
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-stone-700 mb-1"
      >
        {label}
      </label>
      <input
        id={id}
        className={clsx(
          "w-full px-3 py-2 rounded-lg border text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm",
          error ? "border-red-300 bg-red-50" : "border-stone-200 bg-white",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
