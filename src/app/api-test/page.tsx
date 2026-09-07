
"use client";

import { useState } from "react";

export default function ApiTestPage() {
  const [result, setResult] = useState("");

  const createMedicine = async () => {
    try {
      setResult("Creating medicine...");

      const response = await fetch("/api/medicines", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Napa 500mg",
          genericName: "Paracetamol",
          company: "Beximco",
          category: "Pain Killer",
          strength: "500mg",
          dosageForm: "Tablet",
          rack: "A-03",
          minimumStock: 20,
          sellingPrice: 2.5,
          purchasePrice: 1.8,
          taxRate: 5,
        }),
      });

      const data = await response.json();

      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(error);
      setResult("Something went wrong");
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900">
          Pharmatrix API Test
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Test Medicine API without Postman
        </p>

        <div className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Medicine API
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            POST /api/medicines
          </p>

          <button
            onClick={createMedicine}
            className="mt-5 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Create Medicine
          </button>
        </div>

        <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            API Response
          </h2>

          <pre className="mt-4 overflow-auto rounded-lg bg-gray-100 p-4 text-sm">
            {result || "No response yet"}
          </pre>
        </div>
      </div>
    </main>
  );
}

