"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { GuestFormState } from "@/app/actions/guest";

type Props = {
  action: (prev: GuestFormState, fd: FormData) => Promise<GuestFormState>;
  initial?: Record<string, string>;
  token?: string;
  submitLabel: string;
};

const EMPTY: GuestFormState = { errors: {}, values: {} };

const FIELD_LABELS: Record<string, string> = {
  fullName: "Full name",
  email: "Email",
  phone: "Phone",
  country: "Country",
  arrivalDate: "Arrival date",
  wardrobe: "Menswear or womenswear",
  units: "Units",
  chest: "Chest or bust",
  waist: "Waist",
  hip: "Hip",
  shoulder: "Shoulder",
  height: "Height",
  shoeSize: "Shoe size",
  knownSizes: "Known sizes",
  notes: "Notes",
};

export default function GuestForm({ action, initial = {}, token, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, EMPTY);
  const values = { ...initial, ...state.values };
  const [units, setUnits] = useState<"cm" | "in">((values.units as "cm" | "in") || "cm");
  const [wardrobe, setWardrobe] = useState(values.wardrobe || "");
  const err = (k: string) => state.errors[k];
  const errorKeys = Object.keys(state.errors);
  const summaryRef = useRef<HTMLDivElement>(null);
  const unit = units === "cm" ? "cm" : "inches";
  const bustLabel = wardrobe === "womenswear" ? "Bust" : "Chest";

  useEffect(() => {
    if (Object.keys(state.errors).length) summaryRef.current?.focus();
  }, [state]);

  return (
    <form action={formAction} className="space-y-8" noValidate>
      {token && <input type="hidden" name="token" value={token} />}
      {errorKeys.length > 0 && (
        <div ref={summaryRef} tabIndex={-1} role="alert" data-testid="form-errors" className="rounded-lg border border-rose/40 bg-rose/10 px-4 py-3 text-sm">
          <p className="font-semibold text-rose">Please check {errorKeys.length === 1 ? "one field" : `${errorKeys.length} fields`}:</p>
          <ul className="mt-1 list-disc pl-5">
            {errorKeys.map((k) => (
              <li key={k}>
                {k === "form" ? (
                  state.errors[k]
                ) : (
                  <>
                    <a href={`#${k}`} className="underline">
                      {FIELD_LABELS[k] ?? k}
                    </a>
                    : {state.errors[k]}
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <section className="card space-y-4">
        <h2 className="text-xl">About you</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" name="fullName" error={err("fullName")}>
            <input id="fullName" className="field" name="fullName" defaultValue={values.fullName} autoComplete="name" required />
          </Field>
          <Field label="Email" name="email" error={err("email")} hint="So the couple can reach you about your outfit.">
            <input id="email" className="field" name="email" type="email" defaultValue={values.email} autoComplete="email" required />
          </Field>
          <Field label="Phone or WhatsApp (optional)" name="phone" error={err("phone")}>
            <input id="phone" className="field" name="phone" defaultValue={values.phone} autoComplete="tel" />
          </Field>
          <Field label="Country you live in (optional)" name="country" error={err("country")}>
            <input id="country" className="field" name="country" defaultValue={values.country} autoComplete="country-name" />
          </Field>
          <Field
            label="When do you land in India? (optional)"
            name="arrivalDate"
            error={err("arrivalDate")}
            hint="Helps the couple plan store visits and reservations."
          >
            <input id="arrivalDate" className="field" name="arrivalDate" defaultValue={values.arrivalDate} placeholder="e.g. 8 March 2027" />
          </Field>
          <fieldset id="wardrobe" aria-describedby={err("wardrobe") ? "wardrobe-error" : undefined}>
            <legend className="label">I&apos;ll be wearing</legend>
            <div className="flex gap-2">
              {[
                ["menswear", "Menswear"],
                ["womenswear", "Womenswear"],
              ].map(([v, l]) => (
                <label key={v} className={`choice flex-1 justify-center ${wardrobe === v ? "font-semibold" : ""}`}>
                  <input
                    type="radio"
                    name="wardrobe"
                    value={v}
                    className="sr-only"
                    checked={wardrobe === v}
                    onChange={() => setWardrobe(v)}
                  />
                  {l}
                </label>
              ))}
            </div>
            {err("wardrobe") && (
              <p id="wardrobe-error" className="mt-1 text-xs text-rose">
                {err("wardrobe")}
              </p>
            )}
          </fieldset>
        </div>
      </section>

      <section className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl">Your measurements</h2>
          <fieldset id="units" className="flex items-center gap-1 rounded-full border border-line bg-paper-deep p-1 text-sm">
            <legend className="sr-only">Units</legend>
            {(["cm", "in"] as const).map((u) => (
              <label
                key={u}
                className={`cursor-pointer rounded-full px-3 py-1 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-saffron ${
                  units === u ? "bg-white font-semibold shadow-sm" : ""
                }`}
              >
                <input type="radio" name="units" value={u} className="sr-only" checked={units === u} onChange={() => setUnits(u)} />
                {u === "cm" ? "cm" : "inches"}
              </label>
            ))}
          </fieldset>
        </div>
        <p className="text-sm text-ink-soft">
          Measure your body, not a garment, with a soft tape held snug but not tight. No tape? Lay a shirt that fits well flat,
          measure across the chest, and double it.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={`${bustLabel} (${unit})`} name="chest" error={err("chest")} hint="Around the fullest part, tape level.">
            <input id="chest" className="field" name="chest" type="number" step="0.1" inputMode="decimal" defaultValue={values.chest} required />
          </Field>
          <Field label={`Waist (${unit})`} name="waist" error={err("waist")} hint="Around the narrowest part, above the navel.">
            <input id="waist" className="field" name="waist" type="number" step="0.1" inputMode="decimal" defaultValue={values.waist} required />
          </Field>
          <Field label={`Hip (${unit})`} name="hip" error={err("hip")} hint="Around the fullest part of the hips and seat.">
            <input id="hip" className="field" name="hip" type="number" step="0.1" inputMode="decimal" defaultValue={values.hip} required />
          </Field>
          <Field label={`Shoulder (${unit}, optional)`} name="shoulder" error={err("shoulder")} hint="Across the back, shoulder bone to shoulder bone.">
            <input id="shoulder" className="field" name="shoulder" type="number" step="0.1" inputMode="decimal" defaultValue={values.shoulder} />
          </Field>
          <Field label={`Height (${unit}, optional)`} name="height" error={err("height")} hint="Helps with kurta and sherwani length.">
            <input id="height" className="field" name="height" type="number" step="0.1" inputMode="decimal" defaultValue={values.height} />
          </Field>
          <Field label="Shoe size (optional)" name="shoeSize" error={err("shoeSize")} hint="Any system, e.g. EU 42, UK 8, US 9.">
            <input id="shoeSize" className="field" name="shoeSize" defaultValue={values.shoeSize} />
          </Field>
        </div>
        <Field
          label="Sizes you already know (optional)"
          name="knownSizes"
          error={err("knownSizes")}
          hint="e.g. 'Fabindia M', 'Zara 40', 'usually UK 12'. Useful cross-checks for the store."
        >
          <input id="knownSizes" className="field" name="knownSizes" defaultValue={values.knownSizes} />
        </Field>
        <Field label="Anything else (optional)" name="notes" error={err("notes")} hint="Colours or fabrics you avoid, plus-ones, anything else.">
          <textarea id="notes" className="field" name="notes" rows={3} defaultValue={values.notes} />
        </Field>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </button>
        <span className="text-xs text-ink-soft">
          You get a private link to change or delete this later. Your details are deleted after the wedding.
        </span>
      </div>
    </form>
  );
}

type ControlProps = { "aria-describedby"?: string; "aria-invalid"?: boolean };

/**
 * Wraps a control so its label, hint and error are all associated with it.
 * The child input must carry `id={name}`; hint and error ids are derived.
 */
function Field({
  label,
  name,
  error,
  hint,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: React.ReactElement<ControlProps>;
}) {
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;
  const control: React.ReactElement<ControlProps> = {
    ...children,
    props: { ...children.props, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined },
  };
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      {control}
      {error && (
        <p id={errorId} className="mt-1 text-xs text-rose">
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="hint">
          {hint}
        </p>
      )}
    </div>
  );
}
