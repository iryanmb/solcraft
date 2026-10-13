"use client";

// One box per digit of the sign-in code (CODE_LENGTH in lib/config.ts). One real (invisible)
// input sits on top, so typing, pasting and iPhone's "From Mail" suggestion all work, and
// screen readers hear one field.

import { useState } from "react";
import { CODE_LENGTH } from "@/lib/config";

type CodeInputProps = {
  value: string;
  onChange: (code: string) => void;
};

export default function CodeInput({ value, onChange }: CodeInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="code-boxes" style={{ gridTemplateColumns: `repeat(${CODE_LENGTH}, minmax(0, 1fr))` }}>
      {Array.from({ length: CODE_LENGTH }, (_, i) => (
        <span key={i} className={`code-box${focused && i === Math.min(value.length, CODE_LENGTH - 1) ? " active" : ""}`} aria-hidden="true">
          {value[i] ?? ""}
        </span>
      ))}
      <label htmlFor="code" className="visually-hidden">
        {CODE_LENGTH}-digit code
      </label>
      <input
        id="code"
        className="code-input"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={CODE_LENGTH}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoFocus
      />
    </div>
  );
}
