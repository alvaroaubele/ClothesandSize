import { redirect } from "next/navigation";
import { rememberedGuestToken } from "@/app/actions/guest";
import { getGuestByToken } from "@/lib/queries";

/** "My planner": sends a guest who registered on this device back to their private page. */
export default async function MePage() {
  const token = await rememberedGuestToken();
  const guest = token ? await getGuestByToken(token) : null;
  redirect(guest ? `/me/${guest.token}` : "/register?returning=1");
}
