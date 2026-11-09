import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";

export default function TableActions({
  name,
  children,
}: {
  name: string;
  children: ReactNode;
}) {
  const id = useId();
  const menu = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = () => menu.current?.hidePopover();
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);
  return (
    <>
      <button
        ref={trigger}
        popoverTarget={id}
        className="sch-table-actions-trigger"
        type="button"
        aria-label={`Acciones de ${name}`}
        aria-expanded={open}
        aria-controls={id}
      >
        <span aria-hidden="true">•••</span>
      </button>
      <nav
        id={id}
        ref={menu}
        popover="auto"
        className="sch-table-actions-popover"
        aria-label={`Acciones de ${name}`}
        onToggle={(event) => {
          const popup = event.currentTarget;
          const visible = popup.matches(":popover-open");
          setOpen(visible);
          const anchor = trigger.current?.getBoundingClientRect();
          if (!visible || !anchor) return;
          const bounds = popup.getBoundingClientRect();
          popup.style.left = `${Math.max(12, Math.min(anchor.right - bounds.width, window.innerWidth - bounds.width - 12))}px`;
          popup.style.top = `${Math.max(12, anchor.bottom + bounds.height + 8 <= window.innerHeight ? anchor.bottom + 8 : anchor.top - bounds.height - 8)}px`;
        }}
        onClick={(event) => {
          if (
            event.target instanceof Element &&
            event.target.closest("a, button:not(:disabled)")
          )
            event.currentTarget.hidePopover();
        }}
      >
        {children}
      </nav>
    </>
  );
}
