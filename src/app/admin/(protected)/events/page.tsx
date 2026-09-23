import type { Metadata } from "next";
import { deleteEvent, saveEvent } from "@/app/actions/admin";
import ConfirmButton from "@/components/ConfirmButton";
import type { Event } from "@/db/schema";
import { requireAdmin } from "@/lib/adminAuth";
import { getEvents } from "@/lib/queries";

export const metadata: Metadata = { title: "Events — admin", robots: { index: false } };

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function AdminEventsPage({ searchParams }: Props) {
  await requireAdmin();
  const [sp, events] = await Promise.all([searchParams, getEvents()]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Events</h1>
        <p className="text-sm text-ink-soft">
          What guests see on the home page and in their planner. Dates are free text so you can write &quot;Evening of 12
          March&quot; or &quot;TBC&quot;.
        </p>
      </div>
      {sp.saved && <p className="rounded-lg bg-leaf/10 px-3 py-2 text-sm text-leaf">Saved.</p>}
      {sp.error && <p className="rounded-lg bg-rose/10 px-3 py-2 text-sm text-rose">{sp.error}</p>}
      {events.map((e) => (
        <EventForm key={e.id} event={e} />
      ))}
      <details className="card">
        <summary className="cursor-pointer font-semibold">Add an event</summary>
        <div className="mt-4">
          <EventForm />
        </div>
      </details>
    </div>
  );
}

function EventForm({ event }: { event?: Event }) {
  const id = (f: string) => `${event ? `event-${event.id}` : "event-new"}-${f}`;
  return (
    <form action={saveEvent} className="card space-y-3">
      {event && <input type="hidden" name="id" value={event.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={id("name")}>Name</label>
          <input id={id("name")} name="name" className="field" defaultValue={event?.name ?? ""} required />
        </div>
        <div>
          <label className="label" htmlFor={id("dateLabel")}>Date label</label>
          <input id={id("dateLabel")} name="dateLabel" className="field" defaultValue={event?.dateLabel ?? ""} placeholder="e.g. Friday 12 March 2027, 7 pm" />
        </div>
        <div>
          <label className="label" htmlFor={id("timeOfDay")}>Time of day</label>
          <select id={id("timeOfDay")} name="timeOfDay" className="field" defaultValue={event?.timeOfDay ?? "evening"}>
            <option value="day">Daytime</option>
            <option value="evening">Evening</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor={id("sortOrder")}>Order</label>
          <input id={id("sortOrder")} name="sortOrder" type="number" className="field" defaultValue={event?.sortOrder ?? 0} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor={id("dressCode")}>Dress code</label>
        <textarea id={id("dressCode")} name="dressCode" rows={2} className="field" defaultValue={event?.dressCode ?? ""} />
      </div>
      <div>
        <label className="label" htmlFor={id("palette")}>Palette</label>
        <input id={id("palette")} name="palette" className="field" defaultValue={event?.palette ?? ""} />
      </div>
      <div>
        <label className="label" htmlFor={id("notes")}>Notes for guests</label>
        <textarea id={id("notes")} name="notes" rows={2} className="field" defaultValue={event?.notes ?? ""} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary">
          {event ? "Save" : "Add event"}
        </button>
        {event && (
          <ConfirmButton type="submit" formAction={deleteEvent} className="btn-danger" name="id" value={event.id} message={`Delete the event "${event.name}" and every guest's answers for it?`}>
            Delete
          </ConfirmButton>
        )}
      </div>
    </form>
  );
}
