
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold">
        Medical Shop Dashboard
      </h1>

      <div className="mt-6 rounded-xl bg-white p-6 shadow">
        <p>
          Welcome, <strong>{session.user.name}</strong>
        </p>

        <p className="mt-2">
          Email: {session.user.email}
        </p>

        <p className="mt-2">
          Role: {session.user.role}
        </p>
      </div>
    </main>
  );
}