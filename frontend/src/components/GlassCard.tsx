import React from "react";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export const GlassCard = ({ children, className = "" }: Props) => (
  <div className={`glass-card ${className}`}>{children}</div>
);
