import React from "react";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "danger" | "ghost";
  loading?: boolean;
}

export const GlowButton = ({ children, variant = "primary", loading, className = "", ...rest }: Props) => (
  <button className={`glow-btn glow-btn--${variant} ${className}`} disabled={loading || rest.disabled} {...rest}>
    {loading ? <span className="spinner" /> : children}
  </button>
);
