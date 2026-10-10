import type { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  hint?: string;
}

export default function FormField({
  label,
  required,
  error,
  hint,
  children,
}: FormFieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="mt-1 text-xs text-gray-400">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-xs font-medium text-red-500">{error}</p>
      )}
    </div>
  );
}
