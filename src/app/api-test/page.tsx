

"use client";

import { useState } from "react";

type Medicine = {
  _id: string;
  name: string;
};

export default function ApiTestPage() {
  const [result, setResult] = useState("");
  const [medicine, setMedicine] = useState<Medicine | null>(null);

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

      if (data.success && data.medicine) {
        setMedicine({
          _id: data.medicine._id,
          name: data.medicine.name,
        });
      }
    } catch (error) {
      console.error(error);
      setResult("Something went wrong while creating medicine.");
    }
  };

  const createBatch = async () => {
    if (!medicine) {
      setResult("Please create a medicine first.");
      return;
    }

    try {
      setResult("Creating medicine batch...");

      const response = await fetch("/api/medicine-batches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          medicine: medicine._id,
          batchNumber: "NP001",
          manufacturingDate: "2025-02-01",
          expiryDate: "2027-01-31",
          initialStock: 100,
        }),
      });

      const data = await response.json();

      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(error);
      setResult("Something went wrong while creating batch.");
    }
  };

  const getBatches = async () => {
    try {
      setResult("Fetching medicine batches...");

      const response = await fetch(
        "/api/medicine-batches"
      );

      const data = await response.json();

      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(error);
      setResult("Something went wrong while fetching batches.");
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Pharmatrix API Test
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Test Pharmatrix APIs without Postman
          </p>
        </div>

        {/* Medicine API */}
        <div className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
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

          {medicine && (
            <div className="mt-5 rounded-lg border bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-900">
                Medicine Created
              </p>

              <p className="mt-1 text-sm text-gray-600">
                Name: {medicine.name}
              </p>

              <p className="mt-1 break-all text-xs text-gray-500">
                ID: {medicine._id}
              </p>
            </div>
          )}
        </div>

        {/* Batch API */}
        <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Medicine Batch API
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            POST /api/medicine-batches
          </p>

          <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
            <p>
              Medicine:{" "}
              <strong>
                {medicine?.name || "No medicine selected"}
              </strong>
            </p>

            <p className="mt-1">
              Batch Number: <strong>NP001</strong>
            </p>

            <p className="mt-1">
              Initial Stock: <strong>100</strong>
            </p>

            <p className="mt-1">
              Expiry: <strong>31 Jan 2027</strong>
            </p>
          </div>

          <button
            onClick={createBatch}
            disabled={!medicine}
            className="mt-5 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Create Batch
          </button>
        </div>

        {/* GET Batches */}
        <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Get Medicine Batches
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            GET /api/medicine-batches
          </p>

          <button
            onClick={getBatches}
            className="mt-5 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Get Batches
          </button>
        </div>

        {/* API Response */}
        <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            API Response
          </h2>

          <pre className="mt-4 max-h-[500px] overflow-auto rounded-lg bg-gray-100 p-4 text-sm text-gray-800">
            {result || "No response yet"}
          </pre>
        </div>
      </div>
    </main>
  );
}

