import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updateGuest } from "@/app/actions/guest";
import GuestForm from "@/components/GuestForm";
import { getGuestByToken } from "@/lib/queries";
import { cmToInches } from "@/lib/sizeEngine";

export const metadata: Metadata = { title: "Edit my details — Shanai & Rhea", robots: { index: false } };

export default async function EditGuestPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const guest = await getGuestByToken(token);
  if (!guest) notFound();
  const show = (cm: number | null) => (cm == null ? "" : String(guest.units === "in" ? cmToInches(cm) : Math.round(cm * 10) / 10));
  const initial = {
    fullName: guest.fullName,
    email: guest.email,
    phone: guest.phone,
    country: guest.country,
    arrivalDate: guest.arrivalDate,
    wardrobe: guest.wardrobe,
    units: guest.units,
    height: show(guest.heightCm),
    chest: show(guest.chestCm),
    waist: show(guest.waistCm),
    hip: show(guest.hipCm),
    shoulder: show(guest.shoulderCm),
    shoeSize: guest.shoeSize,
    knownSizes: guest.knownSizes,
    notes: guest.notes,
  };
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">Edit my details</h1>
        <Link href={`/me/${token}`} className="text-sm underline">
          Back to my planner
        </Link>
      </div>
      <GuestForm action={updateGuest} initial={initial} token={token} submitLabel="Save changes" />
    </div>
  );
}
