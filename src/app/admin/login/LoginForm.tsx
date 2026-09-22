"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/admin";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="card space-y-4">
      <div>
        <label className="label" htmlFor="passcode">
          Passcode
        </label>
        <input id="passcode" name="passcode" type="password" className="field" autoComplete="current-password" required />
        {state.error && <p className="mt-1 text-xs text-rose">{state.error}</p>}
      </div>
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Checking…" : "Enter"}
      </button>
    </form>
  );
}
