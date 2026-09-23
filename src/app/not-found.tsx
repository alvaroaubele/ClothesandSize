import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      <h1 className="text-3xl">That link doesn&apos;t work</h1>
      <p className="text-ink-soft">
        Private planner links are unguessable, so a typo, a regenerated link, or a deleted record lands here.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/me" className="btn-primary">
          Find my planner on this device
        </Link>
        <Link href="/register" className="btn-secondary">
          Register again
        </Link>
      </div>
      <p className="text-xs text-ink-soft">If you registered on another phone, ask the couple to send you your link.</p>
    </div>
  );
}
