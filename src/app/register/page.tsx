import { createGuest } from "@/app/actions/guest";
import GuestForm from "@/components/GuestForm";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl">Your sizes</h1>
        <p className="mt-2 text-ink-soft">
          Five minutes with a tape measure. We translate your measurements into store sizes and let you pick a look for
          each event. The couple sees your choices and can reserve outfits in Mumbai before you land.
        </p>
      </div>
      <GuestForm action={createGuest} submitLabel="Save and see my sizes" />
    </div>
  );
}
