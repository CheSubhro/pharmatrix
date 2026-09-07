
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import UserMenu from "@/components/auth/UserMenu";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="border-b bg-white px-8 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">
              Pharmatrix
            </h1>

            <p className="text-xs text-gray-500">
              Medical Shop Management System
            </p>
          </div>

          <UserMenu
            name={session.user.name}
            role={session.user.role}
          />
        </div>
      </header>

      <section className="mx-auto max-w-7xl p-8">
        <h2 className="text-3xl font-bold">
          Dashboard
        </h2>

        <div className="mt-6 rounded-xl bg-white p-6 shadow">
          <p>
            Welcome, <strong>{session.user.name}</strong>
          </p>

          <p className="mt-2 text-gray-600">
            Email: {session.user.email}
          </p>

          <p className="mt-2 text-gray-600">
            Role: {session.user.role}
          </p>
        </div>
      </section>
    </main>
  );
}