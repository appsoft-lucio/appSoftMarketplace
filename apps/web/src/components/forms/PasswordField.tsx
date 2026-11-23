import "./PasswordField.css";
﻿import { useId, useState } from "react";

interface PasswordFieldProps {
  label?: string;
  name?: string;
  autoComplete?: string;
  strong?: boolean;
}

export function PasswordField({
  label = "Senha",
  name = "password",
  autoComplete = "current-password",
  strong = false,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  return (
    <div className="field-group">
      <label htmlFor={id}>{label}</label>
      <span className="password-input">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          minLength={strong ? 12 : undefined}
          maxLength={128}
          required
          aria-describedby={strong ? `${id}-hint` : undefined}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-label={`${visible ? "Ocultar" : "Mostrar"} ${label.toLowerCase()}`}
          aria-pressed={visible}
        >
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      </span>
      {strong && <small id={`${id}-hint`}>Use pelo menos 12 caracteres. Prefira uma frase única.</small>}
    </div>
  );
}
