import { redirect } from "next/navigation";
import { adminPasscode, isAdmin } from "@/lib/adminAuth";
import LoginForm from "./LoginForm";

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  const configured = adminPasscode() !== null;
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div>
        <h1 className="text-3xl">Couple&apos;s admin</h1>
        <p className="mt-2 text-sm text-ink-soft">For Shanai and Rhea. Guests do not need this.</p>
      </div>
      {configured ? (
        <LoginForm />
      ) : (
        <p className="rounded-lg bg-rose/10 px-3 py-2 text-sm text-rose">
          ADMIN_PASSCODE is not set on this deployment. Add it in Vercel → Settings → Environment Variables and redeploy.
        </p>
      )}
    </div>
  );
}
