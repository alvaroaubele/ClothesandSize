import type { Metadata } from "next";
import { createGuest } from "@/app/actions/guest";
import GuestForm from "@/components/GuestForm";

export const metadata: Metadata = { title: "Your sizes — Shanai & Rhea" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {sp.returning && (
        <p className="rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm">
          No planner found on this device. If you registered before, open your private link instead of registering twice; the
          couple can resend it.
        </p>
      )}
      <div>
        <h1 className="text-3xl">Your sizes</h1>
        <p className="mt-2 text-ink-soft">
          Five minutes with a tape measure. We translate your measurements into store sizes; then you tell the couple whether
          to reserve for you or leave the shopping to you.
        </p>
      </div>
      <GuestForm action={createGuest} submitLabel="Save and see my sizes" />
    </div>
  );
}
