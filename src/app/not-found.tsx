import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      <h1 className="text-3xl">That link doesn&apos;t work</h1>
      <p className="text-ink-soft">
        Private planner links are unguessable, so a typo or a deleted record lands here. Register again to get a new link.
      </p>
      <Link href="/register" className="btn-primary">
        Enter my sizes
      </Link>
    </div>
  );
}
