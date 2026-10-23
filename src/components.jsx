import { useEffect, useRef } from "react";
import { X } from "@phosphor-icons/react/dist/csr/X";
import { ShieldCheck } from "@phosphor-icons/react/dist/csr/ShieldCheck";
import { Warning } from "@phosphor-icons/react/dist/csr/Warning";
import { Info } from "@phosphor-icons/react/dist/csr/Info";
import { CheckCircle } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { ArrowUpRight } from "@phosphor-icons/react/dist/csr/ArrowUpRight";

export function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    d.showModal();
    return () => d.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={wide ? "modal wide" : "modal"}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-labelledby="modal-title"
    >
      <div className="modal-header">
        <h2 id="modal-title">{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={22} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Button({
  children,
  secondary = false,
  className = "",
  ...props
}) {
  return (
    <button
      className={`${secondary ? "button secondary" : "button"} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
export function Notice({ children, warning = false }) {
  return (
    <div className={`notice ${warning ? "warning" : ""}`}>
      {warning ? <Warning size={21} /> : <Info size={21} />}
      <div>{children}</div>
    </div>
  );
}
export function PageTitle({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function Empty({ title, children }) {
  return (
    <div className="empty">
      <ShieldCheck size={48} weight="light" />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function RiskBadge({ result, dismissed = false }) {
  const labels = {
    idle: "Awaiting transcript",
    low: "Few signals detected",
    elevated: "Elevated risk",
    high: "High risk",
    uncertain: "Analysis limited",
  };
  return (
    <span className={`risk-badge ${dismissed ? "verified" : result.level}`}>
      {dismissed ? <CheckCircle size={20} /> : <Warning size={20} />}{" "}
      {dismissed ? "Checked by you" : labels[result.level]}
    </span>
  );
}
export function OfficialHelp() {
  return (
    <div className="help-actions">
      <a className="button secondary" href="tel:1930">
        Call 1930 <ArrowUpRight size={18} />
      </a>
      <a
        className="button secondary"
        href="https://cybercrime.gov.in/"
        target="_blank"
        rel="noreferrer"
      >
        Cybercrime portal <ArrowUpRight size={18} />
      </a>
    </div>
  );
}
