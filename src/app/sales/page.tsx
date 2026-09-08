
"use client";

import { useEffect, useMemo, useState } from "react";

import { toast } from "sonner";

interface Medicine {
  _id: string;
  name: string;
  genericName?: string;
  company?: string;
  category?: string;
  strength?: string;
  dosageForm?: string;
  rack?: string;
  shelf?: string;
  minimumStock: number;
  sellingPrice: number;
  purchasePrice: number;
  taxRate: number;
  isActive: boolean;
}

interface Rack {
  _id: string;
  name: string;
  code: string;
  shelves: string[];
}

interface CartItem {
  medicine: Medicine;
  quantity: number;
}

export default function SalesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [racksLoading, setRacksLoading] = useState(true);

  const [selectedMedicine, setSelectedMedicine] =
    useState<Medicine | null>(null);

  const [quantity, setQuantity] = useState(1);

  const [cart, setCart] = useState<CartItem[]>([]);

  const [discount, setDiscount] = useState(0);

  const [error, setError] = useState("");

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/medicines");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to fetch medicines"
        );
      }

      const activeMedicines = (data.medicines || []).filter(
        (medicine: Medicine) => medicine.isActive
      );

      setMedicines(activeMedicines);
    } catch (error) {
      console.error("Fetch medicines error:", error);

      setError("Failed to load medicines");

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load medicines"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchRacks = async () => {
    try {
      setRacksLoading(true);

      const response = await fetch("/api/racks");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to fetch racks"
        );
      }

      setRacks(data.racks || []);
    } catch (error) {
      console.error("Fetch racks error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to fetch racks"
      );
    } finally {
      setRacksLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
    fetchRacks();
  }, []);

  const getRackDisplay = (rackId?: string) => {
    if (!rackId) {
      return "-";
    }

    const rack = racks.find(
      (item) => item._id === rackId
    );

    if (!rack) {
      return rackId;
    }

    return `${rack.name} (${rack.code})`;
  };

  const filteredMedicines = medicines.filter((medicine) => {
    const searchText = search.toLowerCase().trim();

    if (!searchText) {
      return false;
    }

    const rackDisplay = getRackDisplay(
      medicine.rack
    ).toLowerCase();

    const shelfDisplay =
      medicine.shelf?.toLowerCase() || "";

    return (
      medicine.name
        ?.toLowerCase()
        .includes(searchText) ||
      medicine.genericName
        ?.toLowerCase()
        .includes(searchText) ||
      medicine.company
        ?.toLowerCase()
        .includes(searchText) ||
      medicine.category
        ?.toLowerCase()
        .includes(searchText) ||
      medicine.strength
        ?.toLowerCase()
        .includes(searchText) ||
      rackDisplay.includes(searchText) ||
      shelfDisplay.includes(searchText)
    );
  });

  const handleSelectMedicine = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setQuantity(1);
  };

  const handleAddToCart = () => {
    if (!selectedMedicine) {
      toast.error("Please select a medicine first");
      return;
    }

    if (quantity < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    const existingItem = cart.find(
      (item) =>
        item.medicine._id === selectedMedicine._id
    );

    if (existingItem) {
      setCart((prev) =>
        prev.map((item) =>
          item.medicine._id === selectedMedicine._id
            ? {
                ...item,
                quantity: item.quantity + quantity,
              }
            : item
        )
      );

      toast.success(
        `${selectedMedicine.name} quantity updated`
      );
    } else {
      setCart((prev) => [
        ...prev,
        {
          medicine: selectedMedicine,
          quantity,
        },
      ]);

      toast.success(
        `${selectedMedicine.name} added to cart`
      );
    }

    setQuantity(1);
  };

  const increaseQuantity = (medicineId: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.medicine._id === medicineId
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  };

  const decreaseQuantity = (medicineId: string) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.medicine._id === medicineId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (medicineId: string) => {
    const item = cart.find(
      (cartItem) =>
        cartItem.medicine._id === medicineId
    );

    setCart((prev) =>
      prev.filter(
        (cartItem) =>
          cartItem.medicine._id !== medicineId
      )
    );

    if (item) {
      toast.success(
        `${item.medicine.name} removed from cart`
      );
    }
  };

  const clearCart = () => {
    if (cart.length === 0) {
      return;
    }

    setCart([]);
    setDiscount(0);

    toast.success("Cart cleared");
  };

  const getItemTotal = (item: CartItem) => {
    return (
      item.quantity * item.medicine.sellingPrice
    );
  };

  const subtotal = useMemo(() => {
    return cart.reduce(
      (total, item) => total + getItemTotal(item),
      0
    );
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce(
      (total, item) => total + item.quantity,
      0
    );
  }, [cart]);

  const handleDiscountChange = (
    value: string
  ) => {
    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
      setDiscount(0);
      return;
    }

    const safeDiscount = Math.max(
      0,
      Math.min(numericValue, subtotal)
    );

    setDiscount(safeDiscount);
  };

  const netAmount = Math.max(
    0,
    subtotal - discount
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Sales / POS
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create a new bill and add medicines to the
            cart.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Medicine Search */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Medicine Search
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Search by medicine name, generic name,
                  company, strength, rack or shelf.
                </p>
              </div>

              <div className="mb-5">
                <input
                  type="text"
                  placeholder="Search medicine..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200"
                />
              </div>

              {loading ? (
                <div className="rounded-lg border border-gray-200 p-8 text-center">
                  <p className="text-sm text-gray-500">
                    Loading medicines...
                  </p>
                </div>
              ) : error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              ) : !search.trim() ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                  <p className="text-sm text-gray-500">
                    Start typing to search for a medicine.
                  </p>
                </div>
              ) : filteredMedicines.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                  <p className="text-sm font-medium text-gray-700">
                    No medicines found
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Try another medicine name or search
                    term.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <div className="max-h-[520px] overflow-y-auto">
                    <table className="min-w-full text-sm">
                      <thead className="sticky top-0 border-b border-gray-200 bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">
                            Medicine
                          </th>

                          <th className="px-4 py-3 text-left font-semibold text-gray-700">
                            Company
                          </th>

                          <th className="px-4 py-3 text-right font-semibold text-gray-700">
                            Selling
                          </th>

                          <th className="px-4 py-3 text-center font-semibold text-gray-700">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100">
                        {filteredMedicines.map(
                          (medicine) => (
                            <tr
                              key={medicine._id}
                              className={`transition hover:bg-gray-50 ${
                                selectedMedicine?._id ===
                                medicine._id
                                  ? "bg-gray-50"
                                  : ""
                              }`}
                            >
                              <td className="px-4 py-4">
                                <div>
                                  <p className="font-semibold text-gray-900">
                                    {medicine.name}
                                  </p>

                                  {medicine.genericName && (
                                    <p className="mt-0.5 text-xs text-gray-500">
                                      {
                                        medicine.genericName
                                      }
                                    </p>
                                  )}

                                  {medicine.strength && (
                                    <p className="mt-0.5 text-xs text-gray-400">
                                      {medicine.strength}
                                    </p>
                                  )}
                                </div>
                              </td>

                              <td className="px-4 py-4 text-gray-600">
                                {medicine.company || "-"}
                              </td>

                              <td className="px-4 py-4 text-right font-medium text-gray-900">
                                ₹
                                {medicine.sellingPrice.toFixed(
                                  2
                                )}
                              </td>

                              <td className="px-4 py-4 text-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSelectMedicine(
                                      medicine
                                    )
                                  }
                                  className="rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white transition hover:bg-gray-800"
                                >
                                  Select
                                </button>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Cart */}
            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Cart
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {cartItemCount} item
                    {cartItemCount !== 1 ? "s" : ""} in
                    cart
                  </p>
                </div>

                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                  >
                    Clear Cart
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
                  <p className="text-sm font-medium text-gray-700">
                    Cart is empty
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Search and select a medicine to add it
                    to the cart.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="border-b border-gray-200 bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">
                            Medicine
                          </th>

                          <th className="px-4 py-3 text-center font-semibold text-gray-700">
                            Quantity
                          </th>

                          <th className="px-4 py-3 text-right font-semibold text-gray-700">
                            Rate
                          </th>

                          <th className="px-4 py-3 text-right font-semibold text-gray-700">
                            Total
                          </th>

                          <th className="px-4 py-3 text-center font-semibold text-gray-700">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100">
                        {cart.map((item) => (
                          <tr
                            key={item.medicine._id}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-4 py-4">
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {item.medicine.name}
                                </p>

                                {item.medicine.genericName && (
                                  <p className="mt-0.5 text-xs text-gray-500">
                                    {
                                      item.medicine
                                        .genericName
                                    }
                                  </p>
                                )}

                                {item.medicine.strength && (
                                  <p className="mt-0.5 text-xs text-gray-400">
                                    {
                                      item.medicine
                                        .strength
                                    }
                                  </p>
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    decreaseQuantity(
                                      item.medicine._id
                                    )
                                  }
                                  className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                                >
                                  −
                                </button>

                                <span className="w-8 text-center font-semibold text-gray-900">
                                  {item.quantity}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    increaseQuantity(
                                      item.medicine._id
                                    )
                                  }
                                  className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            <td className="px-4 py-4 text-right text-gray-700">
                              ₹
                              {item.medicine.sellingPrice.toFixed(
                                2
                              )}
                            </td>

                            <td className="px-4 py-4 text-right font-semibold text-gray-900">
                              ₹
                              {getItemTotal(
                                item
                              ).toFixed(2)}
                            </td>

                            <td className="px-4 py-4 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  removeFromCart(
                                    item.medicine._id
                                  )
                                }
                                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Bill Summary */}
                  <div className="border-t border-gray-200 bg-gray-50 p-5">
                    <div className="ml-auto max-w-sm space-y-3">
                      {/* Subtotal */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Subtotal
                        </span>

                        <span className="text-sm font-semibold text-gray-900">
                          ₹{subtotal.toFixed(2)}
                        </span>
                      </div>

                      {/* Discount */}
                      <div className="flex items-center justify-between gap-4">
                        <label
                          htmlFor="discount"
                          className="text-sm font-medium text-gray-600"
                        >
                          Discount
                        </label>

                        <div className="relative w-36">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                            ₹
                          </span>

                          <input
                            id="discount"
                            type="number"
                            min="0"
                            max={subtotal}
                            step="0.01"
                            value={discount}
                            onChange={(e) =>
                              handleDiscountChange(
                                e.target.value
                              )
                            }
                            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-7 pr-3 text-right text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200"
                          />
                        </div>
                      </div>

                      {/* Net Amount */}
                      <div className="border-t border-gray-300 pt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-base font-semibold text-gray-900">
                            Net Amount
                          </span>

                          <span className="text-xl font-bold text-gray-900">
                            ₹{netAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Selected Medicine */}
          <div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Selected Medicine
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Review the medicine before adding it to
                  the cart.
                </p>
              </div>

              {!selectedMedicine ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                  <p className="text-sm text-gray-500">
                    No medicine selected.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedMedicine.name}
                    </p>

                    {selectedMedicine.genericName && (
                      <p className="mt-1 text-sm text-gray-500">
                        {selectedMedicine.genericName}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs text-gray-500">
                        Company
                      </p>

                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {selectedMedicine.company || "-"}
                      </p>
                    </div>

                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs text-gray-500">
                        Strength
                      </p>

                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {selectedMedicine.strength || "-"}
                      </p>
                    </div>

                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs text-gray-500">
                        Rack
                      </p>

                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {racksLoading
                          ? "Loading..."
                          : getRackDisplay(
                              selectedMedicine.rack
                            )}
                      </p>
                    </div>

                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs text-gray-500">
                        Shelf
                      </p>

                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {selectedMedicine.shelf || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Selling Price
                      </span>

                      <span className="text-lg font-bold text-gray-900">
                        ₹
                        {selectedMedicine.sellingPrice.toFixed(
                          2
                        )}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Tax Rate
                      </span>

                      <span className="text-sm font-medium text-gray-900">
                        {selectedMedicine.taxRate}%
                      </span>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Quantity
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(
                          Math.max(
                            1,
                            Number(e.target.value) || 1
                          )
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="w-full rounded-lg bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
                  >
                    + Add to Cart
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

