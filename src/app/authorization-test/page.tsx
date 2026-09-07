
import { requirePermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/constants/permissions";

export default async function AuthorizationTestPage() {
  const result = await requirePermission(
    PERMISSIONS.MEDICINE_CREATE
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow">
        <h1 className="text-2xl font-bold">
          Authorization Test
        </h1>

        <div className="mt-6 space-y-3">
          <p>
            <strong>Status:</strong>{" "}
            {result.status}
          </p>

          <p>
            <strong>Authorized:</strong>{" "}
            {result.authorized ? "YES" : "NO"}
          </p>

          {result.user && (
            <>
              <p>
                <strong>Name:</strong>{" "}
                {result.user.name}
              </p>

              <p>
                <strong>Email:</strong>{" "}
                {result.user.email}
              </p>

              <p>
                <strong>Role:</strong>{" "}
                {result.user.role}
              </p>
            </>
          )}

          {!result.authorized && result.status === 401 && (
            <p className="rounded-md bg-yellow-50 p-3 text-yellow-700">
              Please login first.
            </p>
          )}

          {!result.authorized && result.status === 403 && (
            <p className="rounded-md bg-red-50 p-3 text-red-700">
              You do not have permission to perform this action.
            </p>
          )}

          {result.authorized && (
            <p className="rounded-md bg-green-50 p-3 text-green-700">
              Permission check passed successfully.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}