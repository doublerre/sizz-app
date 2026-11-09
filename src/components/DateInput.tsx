import { useEffect, useRef, useState } from "react";
import type { InputHTMLAttributes } from "react";
import ReservationCalendar from "./ReservationCalendar";

const noMarks = new Set<string>();

export default function DateInput(
  props: Omit<InputHTMLAttributes<HTMLInputElement>, "type">,
) {
  const input = useRef<HTMLInputElement>(null);
  const [date, setDate] = useState(
    String(props.value ?? props.defaultValue ?? ""),
  );
  useEffect(() => {
    const form = input.current?.form;
    const reset = () =>
      queueMicrotask(() => setDate(input.current?.value ?? ""));
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, []);
  return (
    <div className="date-input">
      <input
        {...props}
        ref={input}
        type="date"
        onChange={(event) => {
          setDate(event.target.value);
          props.onChange?.(event);
        }}
      />
      <ReservationCalendar
        variant="date"
        value={String(props.value ?? date) || null}
        markedDates={noMarks}
        disabled={props.disabled || props.readOnly}
        min={props.min ? String(props.min) : undefined}
        max={props.max ? String(props.max) : undefined}
        onChange={(value) => {
          if (!input.current) return;
          Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            "value",
          )!.set!.call(input.current, value ?? "");
          input.current.dispatchEvent(new Event("input", { bubbles: true }));
          input.current.dispatchEvent(new Event("change", { bubbles: true }));
          setDate(value ?? "");
        }}
      />
    </div>
  );
}
