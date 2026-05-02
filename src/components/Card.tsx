import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  eyebrow?: string;
  actions?: ReactNode;
}

export function Card({ title, eyebrow, actions, children, className = "", ...props }: CardProps) {
  return (
    <section className={`card ${className}`.trim()} {...props}>
      {(title || eyebrow || actions) && (
        <div className="card-header">
          <div>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            {title ? <h2>{title}</h2> : null}
          </div>
          {actions ? <div className="card-actions">{actions}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}
