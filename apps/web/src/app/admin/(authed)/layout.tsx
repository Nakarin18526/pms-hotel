import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminAuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/admin/login");
  }
  const adminRole = ((session.user as any).adminRole ?? "SUPER_ADMIN") as
    | "SUPER_ADMIN"
    | "STAFF";
  const isStaff = adminRole === "STAFF";

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 bg-slate-900 text-slate-100 p-5 flex flex-col">
        <div className="font-serif text-xl mb-1">
          AURELIA
          <span className="ml-1 text-[10px] tracking-[0.3em] text-gold-400">
            HOTEL
          </span>
        </div>
        <div className="text-[11px] tracking-[0.25em] uppercase text-slate-400 mb-8">
          Admin Console
        </div>

        <nav className="space-y-1 flex-1">
          {/* Always visible — STAFF + SUPER_ADMIN */}
          <NavLink href="/admin" icon="📋">
            Bookings
          </NavLink>
          <NavLink href="/admin/calendar" icon="📅">
            Calendar
          </NavLink>

          {/* SUPER_ADMIN only */}
          {!isStaff && (
            <>
              <div className="pt-4 pb-1 px-3 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Configuration
              </div>
              <NavLink href="/admin/room-types" icon="🛏">
                Room Types
              </NavLink>
              <NavLink href="/admin/rates" icon="💰">
                Rate Calendar
              </NavLink>
              <NavLink href="/admin/payment-settings" icon="💳">
                Payment Settings
              </NavLink>
              <NavLink href="/admin/site-settings" icon="✏️">
                Site Content
              </NavLink>
              <NavLink href="/admin/admins" icon="👥">
                Admin Accounts
              </NavLink>
            </>
          )}
        </nav>

        <div className="pt-5 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-brand-700 flex items-center justify-center text-sm font-medium">
              {(session.user.name ?? session.user.email ?? "A")
                .charAt(0)
                .toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">
                {session.user.name ?? "Admin"}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {session.user.email}
              </div>
              <div className="text-[10px] mt-0.5">
                {isStaff ? (
                  <span className="text-amber-400 font-medium tracking-wider">
                    STAFF
                  </span>
                ) : (
                  <span className="text-emerald-400 font-medium tracking-wider">
                    SUPER ADMIN
                  </span>
                )}
              </div>
            </div>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
            <button
              type="submit"
              className="w-full text-left text-xs text-slate-400 hover:text-white px-2 py-1.5 rounded transition-colors"
            >
              ออกจากระบบ →
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
    >
      <span className="text-base">{icon}</span>
      {children}
    </Link>
  );
}
