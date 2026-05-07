import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type BaseProps = {
  label: string;
};

export function InputField({ label, ...props }: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}

export function SelectField({ label, children, ...props }: BaseProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="field">
      <span>{label}</span>
      <select {...props}>{children}</select>
    </label>
  );
}

export function TextareaField({ label, ...props }: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="field field-full">
      <span>{label}</span>
      <textarea {...props} />
    </label>
  );
}
