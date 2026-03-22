"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

type Category = {
  id: string;
  name: string;
  type: "needs" | "wants" | "savings";
};

type Budget = {
  id: string;
  category_id: string;
  expected_amount: number;
  categories?: Category | Category[];
};

type Month = {
  id: string;
  month: string;
};

export default function BudgetsPageLogic() {
  const supabase = createClient();

  // State
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [months, setMonths] = useState<Month[]>([]);
  const [selectedMonthId, setSelectedMonthId] = useState<string | null>(null);
  const [form, setForm] = useState({ category_id: "", expected_amount: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newMonthName, setNewMonthName] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Derived values
  const totalPages = Math.ceil(budgets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = budgets.slice(startIndex, startIndex + itemsPerPage);

  // Fetch categories + months
  useEffect(() => {
    const fetchData = async () => {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;
      if (!userId) return;

      const { data: catData } = await supabase.from("categories").select("*");
      setCategories(catData ?? []);

      const { data: monthData } = await supabase
        .from("months")
        .select("id, month")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      setMonths(monthData ?? []);
      if (monthData && monthData.length > 0) {
        setSelectedMonthId(monthData[0].id);
      }
    };

    fetchData();
  }, [supabase]);

  // Fetch budgets when month changes
  useEffect(() => {
    const fetchBudgets = async () => {
      if (!selectedMonthId) return;
      const { data } = await supabase
        .from("budgets")
        .select("id, category_id, expected_amount, categories(id, name, type)")
        .eq("month_id", selectedMonthId);
      setBudgets(data ?? []);
      setCurrentPage(1); // reset pagination
    };
    fetchBudgets();
  }, [selectedMonthId, supabase]);

  // Form change handler
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value ?? "" });
  };

  // Add or Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;
    if (!userId || !selectedMonthId) return toast.error("Not logged in");

    if (editingId) {
      const { error } = await supabase
        .from("budgets")
        .update({
          category_id: form.category_id,
          expected_amount: Number(form.expected_amount),
        })
        .eq("id", editingId)
        .eq("user_id", userId);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Budget updated!");
        setEditingId(null);
      }
    } else {
      const { error } = await supabase.from("budgets").insert([
        {
          user_id: userId,
          month_id: selectedMonthId,
          category_id: form.category_id,
          expected_amount: Number(form.expected_amount),
        },
      ]);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Budget added!");
      }
    }

    setForm({ category_id: "", expected_amount: "" });

    const { data } = await supabase
      .from("budgets")
      .select("id, category_id, expected_amount, categories(id, name, type)")
      .eq("month_id", selectedMonthId);
    setBudgets(data ?? []);
  };

  // Edit
  const handleEdit = (b: Budget) => {
    setForm({
      category_id: b.category_id ?? "",
      expected_amount: b.expected_amount?.toString() ?? "",
    });
    setEditingId(b.id);
  };

  // Delete
  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Budget deleted!");
      setBudgets(budgets.filter((b) => b.id !== id));
    }
  };

  return (
    <div className="p-6 bg-sky-950 min-h-screen text-white space-y-6">
      <h2 className="text-2xl font-bold tracking-wide">Budgets</h2>
      {/* Month Selector + Add Month Form inline */}
      <div className="flex flex-wrap items-center justify-between bg-blue-900 p-3 rounded-lg shadow-md gap-4">
        {/* Left: Month Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <label className="text-sm font-semibold text-white">Select Month:</label>
          <select
            value={selectedMonthId ?? ""}
            onChange={(e) => setSelectedMonthId(e.target.value)}
            className="rounded-md bg-blue-950 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500"
          >
            {months.map((m) => (
              <option key={m.id} value={m.id}>
                {m.month}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Add Month Form */}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const user = await supabase.auth.getUser();
            const userId = user.data.user?.id;
            if (!userId) return toast.error("Not logged in");

            if (!newMonthName.trim()) return toast.error("Enter a month name");

            const { data, error } = await supabase
              .from("months")
              .insert([{ user_id: userId, month: newMonthName }])
              .select()
              .single();

            if (error) {
              toast.error(error.message);
            } else {
              toast.success(`${newMonthName} created!`);
              setMonths((prev) => [data, ...prev]);
              setSelectedMonthId(data.id);
              setNewMonthName("");
            }
          }}
          className="flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={newMonthName}
            onChange={(e) => setNewMonthName(e.target.value)}
            placeholder="e.g. April 2026"
            className="rounded-md bg-blue-950 px-3 py-2 text-sm text-white w-40"
          />
          <button
            type="submit"
            className="bg-sky-600 text-white px-3 py-2 rounded-md text-sm font-semibold hover:bg-sky-500 focus:ring-2 focus:ring-sky-400 whitespace-nowrap"
          >
            + Add Month
          </button>
        </form>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap gap-3 items-center bg-sky-900 p-4 rounded-lg shadow-md"
      >
        <select
          name="category_id"
          value={form.category_id ?? ""}
          onChange={handleChange}
          className="rounded-md bg-sky-950 px-3 py-2 text-sm text-white"
          required
        >
          <option value="">Category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.type})
            </option>
          ))}
        </select>
        <input
          type="number"
          name="expected_amount"
          value={form.expected_amount ?? ""}
          onChange={handleChange}
          placeholder="Expected Amount"
          className="rounded-md bg-sky-950 px-3 py-2 text-sm text-white"
          required
        />
        <button
          type="submit"
          className="bg-teal-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-teal-500 focus:ring-2 focus:ring-teal-400"
        >
          {editingId ? "Update" : "Add"}
        </button>
      </form>

      {/* Budgets Table */}
      <div className="overflow-x-auto bg-sky-900 rounded-lg shadow-md">
        <table className="min-w-full text-sm">
          <thead className="bg-sky-800 text-gray-200">
            <tr>
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2 text-left">Category Type</th>
              <th className="px-4 py-2 text-right">Expected Amount</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-4 text-center text-gray-500">
                  No budgets yet
                </td>
              </tr>
            ) : (
              currentItems.map((b) => (
                <tr
                  key={b.id}
                  className="border-t border-sky-700 hover:bg-sky-800 transition-colors"
                >
                  {/* Category Name */}
                  <td className="px-3 py-2">
                    {Array.isArray(b.categories)
                      ? b.categories[0]?.name ?? "No category"
                      : b.categories?.name ?? "No category"}
                  </td>

                  {/* Category Type */}
                  <td className="px-3 py-2 text-gray-400">
                    {Array.isArray(b.categories)
                      ? b.categories[0]?.type ?? "No type"
                      : b.categories?.type ?? "No type"}
                  </td>

                  {/* Expected Amount */}
                  <td className="px-4 py-2 text-right">
                    ₱{b.expected_amount.toFixed(2)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(b)}
                        className="w-9 h-9 flex items-center justify-center rounded-md bg-amber-600 text-white hover:bg-amber-500 focus:ring-2 focus:ring-amber-400"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(b.id)}
                        className="w-9 h-9 flex items-center justify-center rounded-md bg-slate-600 text-white hover:bg-slate-500 focus:ring-2 focus:ring-slate-400"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className="flex justify-center items-center gap-2 p-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-3 py-1 rounded-md bg-sky-600 text-white disabled:opacity-50 hover:bg-sky-700"
          >
            前
          </button>

          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded-md ${currentPage === i + 1
                ? "bg-sky-500 text-white"
                : "bg-sky-800 text-gray-200 hover:bg-sky-700"
                }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-3 py-1 rounded-md bg-sky-600 text-white disabled:opacity-50 hover:bg-sky-700"
          >
            次
          </button>
        </div>
      </div>

      {/* Floating Add Button */}
      {/* <div className="flex justify-end p-4">
        <button
          type="button"
          onClick={() => alert("Add new budget")}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-sky-600 text-white hover:bg-sky-500 focus:ring-2 focus:ring-green-400"
        >
          <PlusIcon className="h-5 w-5" />
        </button>
      </div> */}
    </div>
  );
}

