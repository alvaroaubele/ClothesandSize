import { deleteEvent, saveEvent } from "@/app/actions/admin";
import type { Event } from "@/db/schema";
import { getEvents } from "@/lib/queries";

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function AdminEventsPage({ searchParams }: Props) {
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
  return (
    <form action={saveEvent} className="card space-y-3">
      {event && <input type="hidden" name="id" value={event.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Name</label>
          <input name="name" className="field" defaultValue={event?.name ?? ""} required />
        </div>
        <div>
          <label className="label">Date label</label>
          <input name="dateLabel" className="field" defaultValue={event?.dateLabel ?? ""} placeholder="e.g. Friday 12 March 2027, 7 pm" />
        </div>
        <div>
          <label className="label">Time of day</label>
          <select name="timeOfDay" className="field" defaultValue={event?.timeOfDay ?? "evening"}>
            <option value="day">Daytime</option>
            <option value="evening">Evening</option>
          </select>
        </div>
        <div>
          <label className="label">Order</label>
          <input name="sortOrder" type="number" className="field" defaultValue={event?.sortOrder ?? 0} />
        </div>
      </div>
      <div>
        <label className="label">Dress code</label>
        <textarea name="dressCode" rows={2} className="field" defaultValue={event?.dressCode ?? ""} />
      </div>
      <div>
        <label className="label">Palette</label>
        <input name="palette" className="field" defaultValue={event?.palette ?? ""} />
      </div>
      <div>
        <label className="label">Notes for guests</label>
        <textarea name="notes" rows={2} className="field" defaultValue={event?.notes ?? ""} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary">
          {event ? "Save" : "Add event"}
        </button>
        {event && (
          <button type="submit" formAction={deleteEvent} className="btn-danger" name="id" value={event.id}>
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
