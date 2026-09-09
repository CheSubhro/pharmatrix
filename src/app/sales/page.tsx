

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  description?: string;
  isActive: boolean;
}

interface Customer {
  _id: string;
  customerName: string;
  phone: string;
  email?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  notes?: string;
  isActive: boolean;
}

interface CartItem {
  medicine: Medicine;
  quantity: number;
}

export default function SalesPage() {
  const router = useRouter();

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [racksLoading, setRacksLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedMedicine, setSelectedMedicine] =
    useState<Medicine | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);

  // Step 8.3 - Customer
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);
  const [customersLoading, setCustomersLoading] =
    useState(true);

  // CASH payment
  const [amountReceived, setAmountReceived] = useState(0);

  // Complete Sale loading
  const [completingSale, setCompletingSale] =
    useState(false);

  // -----------------------------
  // Fetch medicines
  // -----------------------------

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

      setMedicines(data.medicines || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load medicines");
      toast.error("Failed to load medicines");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // Fetch racks
  // -----------------------------

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
    } catch (err) {
      console.error(err);
      toast.error("Failed to load racks");
    } finally {
      setRacksLoading(false);
    }
  };

  // -----------------------------
  // Fetch customers
  // -----------------------------

  const fetchCustomers = async () => {
    try {
      setCustomersLoading(true);

      const response = await fetch("/api/customers");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to fetch customers"
        );
      }

      setCustomers(data.customers || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load customers");
    } finally {
      setCustomersLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
    fetchRacks();
    fetchCustomers();
  }, []);

  // -----------------------------
  // Rack display
  // -----------------------------

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

  // -----------------------------
  // Medicine search
  // -----------------------------

  const filteredMedicines = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return medicines;
    }

    return medicines.filter((medicine) => {
      return [
        medicine.name,
        medicine.genericName,
        medicine.company,
        medicine.category,
        medicine.strength,
        medicine.dosageForm,
        medicine.rack,
        medicine.shelf,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query)
        );
    });
  }, [medicines, search]);

  // -----------------------------
  // Customer search
  // -----------------------------

  const filteredCustomers = useMemo(() => {
    const query = customerSearch
      .trim()
      .toLowerCase();

    if (!query) {
      return customers.slice(0, 8);
    }

    return customers
      .filter((customer) => {
        return [
          customer.customerName,
          customer.phone,
          customer.email,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(query)
          );
      })
      .slice(0, 8);
  }, [customers, customerSearch]);

  // -----------------------------
  // Select medicine
  // -----------------------------

  const handleSelectMedicine = (
    medicine: Medicine
  ) => {
    setSelectedMedicine(medicine);
    setQuantity(1);
  };

  // -----------------------------
  // Select customer
  // -----------------------------

  const handleSelectCustomer = (
    customer: Customer
  ) => {
    setSelectedCustomer(customer);
    setCustomerSearch("");
  };

  // -----------------------------
  // Remove customer
  // -----------------------------

  const handleRemoveCustomer = () => {
    setSelectedCustomer(null);
    setCustomerSearch("");
    toast.success("Customer removed from bill");
  };

  // -----------------------------
  // Add medicine to cart
  // -----------------------------

  const handleAddToCart = () => {
    if (!selectedMedicine) {
      toast.error("Please select a medicine");
      return;
    }

    if (quantity < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) =>
          item.medicine._id ===
          selectedMedicine._id
      );

      if (existingItem) {
        return currentCart.map((item) =>
          item.medicine._id ===
          selectedMedicine._id
            ? {
                ...item,
                quantity:
                  item.quantity + quantity,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          medicine: selectedMedicine,
          quantity,
        },
      ];
    });

    toast.success(
      `${selectedMedicine.name} added to cart`
    );

    setQuantity(1);
  };

  // -----------------------------
  // Increase quantity
  // -----------------------------

  const increaseQuantity = (
    medicineId: string
  ) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.medicine._id === medicineId
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  };

  // -----------------------------
  // Decrease quantity
  // -----------------------------

  const decreaseQuantity = (
    medicineId: string
  ) => {
    setCart((currentCart) =>
      currentCart
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

  // -----------------------------
  // Remove item
  // -----------------------------

  const removeFromCart = (
    medicineId: string
  ) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) =>
          item.medicine._id !== medicineId
      )
    );

    toast.success(
      "Medicine removed from cart"
    );
  };

  // -----------------------------
  // Clear cart
  // -----------------------------

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setAmountReceived(0);
  };

  // -----------------------------
  // Item total
  // -----------------------------

  const getItemTotal = (
    item: CartItem
  ) => {
    return (
      item.quantity *
      item.medicine.sellingPrice
    );
  };

  // -----------------------------
  // Subtotal
  // -----------------------------

  const subtotal = useMemo(() => {
    return cart.reduce(
      (sum, item) =>
        sum + getItemTotal(item),
      0
    );
  }, [cart]);

  // -----------------------------
  // Cart item count
  // -----------------------------

  const cartItemCount = useMemo(() => {
    return cart.reduce(
      (sum, item) =>
        sum + item.quantity,
      0
    );
  }, [cart]);

  // -----------------------------
  // Discount
  // -----------------------------

  const handleDiscountChange = (
    value: string
  ) => {
    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
      setDiscount(0);
      return;
    }

    const safeDiscount = Math.min(
      Math.max(numericValue, 0),
      subtotal
    );

    setDiscount(safeDiscount);
  };

  // -----------------------------
  // Net amount before tax
  // -----------------------------

  const netBeforeTax = Math.max(
    0,
    subtotal - discount
  );

  // -----------------------------
  // Tax calculation
  // -----------------------------

  const cartTaxDetails = useMemo(() => {
    if (subtotal <= 0) {
      return cart.map((item) => ({
        medicineId: item.medicine._id,
        itemSubtotal: 0,
        discountShare: 0,
        taxableAmount: 0,
        taxAmount: 0,
      }));
    }

    return cart.map((item) => {
      const itemSubtotal =
        getItemTotal(item);

      const discountShare =
        (itemSubtotal / subtotal) *
        discount;

      const taxableAmount = Math.max(
        0,
        itemSubtotal - discountShare
      );

      const taxAmount =
        (taxableAmount *
          item.medicine.taxRate) /
        100;

      return {
        medicineId: item.medicine._id,
        itemSubtotal,
        discountShare,
        taxableAmount,
        taxAmount,
      };
    });
  }, [cart, subtotal, discount]);

  // -----------------------------
  // Total tax
  // -----------------------------

  const totalTax = useMemo(() => {
    return cartTaxDetails.reduce(
      (sum, item) =>
        sum + item.taxAmount,
      0
    );
  }, [cartTaxDetails]);

  // -----------------------------
  // Grand total
  // -----------------------------

  const grandTotal = useMemo(() => {
    return netBeforeTax + totalTax;
  }, [netBeforeTax, totalTax]);

  // -----------------------------
  // CASH payment status
  // -----------------------------

  const paymentStatus = useMemo(() => {
    if (
      amountReceived >= grandTotal &&
      grandTotal > 0
    ) {
      return "PAID";
    }

    if (amountReceived > 0) {
      return "PARTIAL";
    }

    return "PENDING";
  }, [amountReceived, grandTotal]);

  // -----------------------------
  // Amount due
  // -----------------------------

  const amountDue = Math.max(
    0,
    grandTotal - amountReceived
  );

  // -----------------------------
  // Change due
  // -----------------------------

  const changeDue = Math.max(
    0,
    amountReceived - grandTotal
  );

  // -----------------------------
  // Amount received change
  // -----------------------------

  const handleAmountReceivedChange = (
    value: string
  ) => {
    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
      setAmountReceived(0);
      return;
    }

    setAmountReceived(
      Math.max(0, numericValue)
    );
  };

  // -----------------------------
  // Complete Sale
  // -----------------------------

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (grandTotal <= 0) {
      toast.error("Invalid bill amount");
      return;
    }

    if (amountReceived < grandTotal) {
      toast.error(
        `Payment incomplete. ₹${amountDue.toFixed(
          2
        )} still due.`
      );
      return;
    }

    try {
      setCompletingSale(true);

      const saleItems = cart.map((item) => {
        const taxDetail =
          cartTaxDetails.find(
            (taxItem) =>
              taxItem.medicineId ===
              item.medicine._id
          );

        return {
          medicine: item.medicine._id,
          quantity: item.quantity,
          sellingPrice:
            item.medicine.sellingPrice,
          taxRate: item.medicine.taxRate,
          discount:
            taxDetail?.discountShare || 0,
          total: getItemTotal(item),
        };
      });

      const response = await fetch(
        "/api/sales",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            customer:
              selectedCustomer?._id ||
              undefined,

            items: saleItems,

            subtotal,

            discount,

            tax: totalTax,

            grandTotal,

            paymentMethod: "CASH",

            paymentStatus: "PAID",

            status: "COMPLETED",

            saleDate:
              new Date().toISOString(),
          }),
        }
      );

      const data = await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to complete sale"
        );
      }

      toast.success(
        `Sale ${data.sale.billNumber} completed successfully`
      );

      router.push(
        `/sales/${data.sale._id}`
      );
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to complete sale"
      );
    } finally {
      setCompletingSale(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          New Sale
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Search medicines and create a new bill
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT SIDE */}
        <div className="space-y-6 lg:col-span-2">
          {/* Medicine Search */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Medicine Search
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Search by medicine name, generic name,
                company, rack or shelf.
              </p>
            </div>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search medicine..."
              className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-black"
            />

            {loading ? (
              <div className="py-8 text-center text-sm text-gray-500">
                Loading medicines...
              </div>
            ) : error ? (
              <div className="py-8 text-center text-sm text-red-600">
                {error}
              </div>
            ) : filteredMedicines.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No medicines found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-3 py-3">
                        Medicine
                      </th>

                      <th className="px-3 py-3">
                        Company
                      </th>

                      <th className="px-3 py-3">
                        Rack / Shelf
                      </th>

                      <th className="px-3 py-3">
                        Price
                      </th>

                      <th className="px-3 py-3 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredMedicines.map(
                      (medicine) => (
                        <tr
                          key={medicine._id}
                          className="border-b border-gray-100 last:border-0"
                        >
                          <td className="px-3 py-3">
                            <div className="font-medium text-gray-900">
                              {medicine.name}
                            </div>

                            {medicine.genericName && (
                              <div className="text-xs text-gray-500">
                                {medicine.genericName}
                              </div>
                            )}

                            {medicine.strength && (
                              <div className="text-xs text-gray-400">
                                {medicine.strength}
                              </div>
                            )}
                          </td>

                          <td className="px-3 py-3 text-gray-600">
                            {medicine.company || "-"}
                          </td>

                          <td className="px-3 py-3 text-gray-600">
                            {racksLoading
                              ? "..."
                              : getRackDisplay(
                                  medicine.rack
                                )}

                            {medicine.shelf && (
                              <div className="text-xs text-gray-400">
                                {medicine.shelf}
                              </div>
                            )}
                          </td>

                          <td className="px-3 py-3 font-medium text-gray-900">
                            ₹
                            {medicine.sellingPrice.toFixed(
                              2
                            )}
                          </td>

                          <td className="px-3 py-3 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                handleSelectMedicine(
                                  medicine
                                )
                              }
                              className="rounded-lg bg-black px-3 py-2 text-xs font-medium text-white hover:bg-gray-800"
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
            )}
          </div>

          {/* Cart */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Cart
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {cartItemCount} item
                  {cartItemCount !== 1 ? "s" : ""}
                </p>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700"
                >
                  Clear Cart
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 py-10 text-center">
                <p className="text-sm text-gray-500">
                  Cart is empty
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Select a medicine and add it to cart
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                        <th className="px-3 py-3">
                          Medicine
                        </th>

                        <th className="px-3 py-3">
                          Qty
                        </th>

                        <th className="px-3 py-3">
                          Rate
                        </th>

                        <th className="px-3 py-3">
                          Tax
                        </th>

                        <th className="px-3 py-3">
                          Total
                        </th>

                        <th className="px-3 py-3 text-right">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {cart.map((item) => (
                        <tr
                          key={item.medicine._id}
                          className="border-b border-gray-100 last:border-0"
                        >
                          <td className="px-3 py-3">
                            <div className="font-medium text-gray-900">
                              {item.medicine.name}
                            </div>

                            {item.medicine.strength && (
                              <div className="text-xs text-gray-500">
                                {item.medicine.strength}
                              </div>
                            )}
                          </td>

                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  decreaseQuantity(
                                    item.medicine._id
                                  )
                                }
                                className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-sm hover:bg-gray-100"
                              >
                                −
                              </button>

                              <span className="min-w-6 text-center font-medium">
                                {item.quantity}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  increaseQuantity(
                                    item.medicine._id
                                  )
                                }
                                className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-sm hover:bg-gray-100"
                              >
                                +
                              </button>
                            </div>
                          </td>

                          <td className="px-3 py-3 text-gray-600">
                            ₹
                            {item.medicine.sellingPrice.toFixed(
                              2
                            )}
                          </td>

                          <td className="px-3 py-3 text-gray-600">
                            {item.medicine.taxRate}%
                          </td>

                          <td className="px-3 py-3 font-medium text-gray-900">
                            ₹
                            {getItemTotal(
                              item
                            ).toFixed(2)}
                          </td>

                          <td className="px-3 py-3 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                removeFromCart(
                                  item.medicine._id
                                )
                              }
                              className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700"
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
                <div className="mt-6 ml-auto max-w-sm space-y-3 border-t border-gray-200 pt-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      Subtotal
                    </span>

                    <span className="font-medium text-gray-900">
                      ₹{subtotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      Discount
                    </span>

                    <div className="flex items-center">
                      <span className="mr-1 text-gray-500">
                        ₹
                      </span>

                      <input
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
                        className="w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-right text-sm outline-none focus:border-black"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      Taxable Amount
                    </span>

                    <span className="font-medium text-gray-900">
                      ₹{netBeforeTax.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      GST / Tax
                    </span>

                    <span className="font-medium text-gray-900">
                      ₹{totalTax.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between border-t border-gray-200 pt-3">
                    <span className="font-semibold text-gray-900">
                      Grand Total
                    </span>

                    <span className="text-lg font-bold text-gray-900">
                      ₹{grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-6">
          {/* Selected Medicine */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Selected Medicine
            </h2>

            {!selectedMedicine ? (
              <div className="mt-6 rounded-lg border border-dashed border-gray-300 py-10 text-center">
                <p className="text-sm text-gray-500">
                  No medicine selected
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Select a medicine from the search list
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {selectedMedicine.name}
                  </h3>

                  {selectedMedicine.genericName && (
                    <p className="text-sm text-gray-500">
                      {selectedMedicine.genericName}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="text-xs text-gray-500">
                      Company
                    </div>

                    <div className="mt-1 font-medium text-gray-900">
                      {selectedMedicine.company || "-"}
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="text-xs text-gray-500">
                      Strength
                    </div>

                    <div className="mt-1 font-medium text-gray-900">
                      {selectedMedicine.strength || "-"}
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="text-xs text-gray-500">
                      Rack
                    </div>

                    <div className="mt-1 font-medium text-gray-900">
                      {racksLoading
                        ? "..."
                        : getRackDisplay(
                            selectedMedicine.rack
                          )}
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="text-xs text-gray-500">
                      Shelf
                    </div>

                    <div className="mt-1 font-medium text-gray-900">
                      {selectedMedicine.shelf || "-"}
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="text-xs text-gray-500">
                      Selling Price
                    </div>

                    <div className="mt-1 font-medium text-gray-900">
                      ₹
                      {selectedMedicine.sellingPrice.toFixed(
                        2
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="text-xs text-gray-500">
                      Tax Rate
                    </div>

                    <div className="mt-1 font-medium text-gray-900">
                      {selectedMedicine.taxRate}%
                    </div>
                  </div>
                </div>

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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                >
                  Add to Cart
                </button>
              </div>
            )}
          </div>

          {/* Customer - Step 8.3 */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Customer
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Select a customer for this bill.
                Leave empty for walk-in customer.
              </p>
            </div>

            {!selectedCustomer ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) =>
                    setCustomerSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search customer by name or phone..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                />

                {customersLoading ? (
                  <div className="py-5 text-center text-sm text-gray-500">
                    Loading customers...
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 py-5 text-center">
                    <p className="text-sm text-gray-500">
                      No customers found
                    </p>

                    {customerSearch.trim() && (
                      <p className="mt-1 text-xs text-gray-400">
                        Try another name or phone number.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200">
                    {filteredCustomers.map(
                      (customer) => (
                        <button
                          key={customer._id}
                          type="button"
                          onClick={() =>
                            handleSelectCustomer(
                              customer
                            )
                          }
                          className="block w-full border-b border-gray-100 px-3 py-3 text-left last:border-0 hover:bg-gray-50"
                        >
                          <div className="font-medium text-gray-900">
                            {customer.customerName}
                          </div>

                          <div className="mt-1 text-xs text-gray-500">
                            {customer.phone}
                          </div>

                          {customer.email && (
                            <div className="text-xs text-gray-400">
                              {customer.email}
                            </div>
                          )}
                        </button>
                      )
                    )}
                  </div>
                )}

                {!customerSearch.trim() &&
                  !customersLoading &&
                  customers.length === 0 && (
                    <p className="text-xs text-gray-400">
                      No active customers available.
                    </p>
                  )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-gray-500">
                        Selected Customer
                      </div>

                      <div className="mt-1 text-base font-semibold text-gray-900">
                        {selectedCustomer.customerName}
                      </div>

                      <div className="mt-1 text-sm text-gray-600">
                        {selectedCustomer.phone}
                      </div>

                      {selectedCustomer.email && (
                        <div className="mt-1 text-xs text-gray-500">
                          {selectedCustomer.email}
                        </div>
                      )}
                    </div>

                    <span className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
                      Selected
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveCustomer}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Remove Customer
                </button>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Payment
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Current payment method is CASH only.
              </p>
            </div>

            <div className="space-y-4">
              {/* Payment Method */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Payment Method
                </label>

                <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-gray-50 px-4 py-3">
                  <span className="text-sm font-medium text-gray-900">
                    CASH
                  </span>

                  <span className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
                    Active
                  </span>
                </div>
              </div>

              {/* Amount Payable */}
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="text-xs text-gray-500">
                  Amount Payable
                </div>

                <div className="mt-1 text-2xl font-bold text-gray-900">
                  ₹{grandTotal.toFixed(2)}
                </div>
              </div>

              {/* Amount Received */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Amount Received
                </label>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amountReceived}
                    onChange={(e) =>
                      handleAmountReceivedChange(
                        e.target.value
                      )
                    }
                    placeholder="Enter cash received"
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-8 pr-3 text-sm outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* Payment Status */}
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <span className="text-sm text-gray-500">
                  Payment Status
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    paymentStatus === "PAID"
                      ? "bg-green-100 text-green-700"
                      : paymentStatus === "PARTIAL"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {paymentStatus}
                </span>
              </div>

              {/* Due / Change */}
              {amountReceived < grandTotal &&
              grandTotal > 0 ? (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                  <div className="text-xs text-yellow-700">
                    Amount Due
                  </div>

                  <div className="mt-1 text-xl font-bold text-yellow-800">
                    ₹{amountDue.toFixed(2)}
                  </div>
                </div>
              ) : grandTotal > 0 ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="text-xs text-green-700">
                    Change Due
                  </div>

                  <div className="mt-1 text-xl font-bold text-green-800">
                    ₹{changeDue.toFixed(2)}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="text-sm text-gray-500">
                    Add medicines to cart to calculate
                    payment.
                  </div>
                </div>
              )}

              {/* Complete Sale */}
              <button
                type="button"
                onClick={handleCompleteSale}
                disabled={
                  completingSale ||
                  cart.length === 0 ||
                  grandTotal <= 0 ||
                  amountReceived < grandTotal
                }
                className="w-full rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {completingSale
                  ? "Completing Sale..."
                  : "Complete Sale"}
              </button>

              <p className="text-center text-xs text-gray-400">
                Stock will automatically decrease using
                FEFO after completing the sale.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

