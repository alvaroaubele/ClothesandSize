import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions/admin";
import { isAdmin } from "@/lib/adminAuth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-paper-deep px-4 py-3">
        <nav className="flex flex-wrap gap-4 text-sm font-semibold">
          <Link href="/admin" className="hover:text-saffron-deep">
            Guests
          </Link>
          <Link href="/admin/events" className="hover:text-saffron-deep">
            Events
          </Link>
          <Link href="/admin/looks" className="hover:text-saffron-deep">
            Looks
          </Link>
          <a href="/admin/export" className="hover:text-saffron-deep">
            Download CSV
          </a>
        </nav>
        <form action={logout}>
          <button type="submit" className="text-sm underline">
            Log out
          </button>
        </form>
      </div>
      {children}
    </div>
  );
}
