import { useState } from "react";

type Props = {
  id: string;
  label: string;
  type: "text" | "email" | "password";
  value: string;
  error: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  placeholder: string;
  autoComplete: string;
  inputMode?: "numeric" | "email";
  maxLength?: number;
  disabled?: boolean;
};

export default function FormField({
  id,
  label,
  type,
  value,
  error,
  onChange,
  onBlur,
  placeholder,
  autoComplete,
  inputMode,
  maxLength,
  disabled,
}: Props) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="mb-3">
      <label className="form-label" htmlFor={id}>
        {label}
      </label>
      <div className="field-control">
        <input
          className={`form-control${error ? " is-invalid" : ""}${isPassword ? " has-toggle" : ""}`}
          id={id}
          name={id}
          type={isPassword && visible ? "text" : type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          disabled={disabled}
          aria-required="true"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
        />
        {isPassword && (
          <button
            type="button"
            className="field-toggle"
            onClick={() => setVisible((current) => !current)}
            aria-pressed={visible}
            aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          >
            <i
              className={`bi ${visible ? "bi-eye-slash" : "bi-eye"}`}
              aria-hidden="true"
            />
          </button>
        )}
      </div>
      {error && (
        <div className="field-error" id={`${id}-error`} role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
