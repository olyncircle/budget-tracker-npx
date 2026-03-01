"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

export default function BudgetsPage() {
  const supabase = createClient();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [months, setMonths] = useState<Month[]>([]);
  const [selectedMonthId, setSelectedMonthId] = useState<string | null>(null);
  const [form, setForm] = useState({ category_id: "", expected_amount: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  // 🔹 Fetch categories + months
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

  // 🔹 Fetch budgets when month changes
  useEffect(() => {
    const fetchBudgets = async () => {
      if (!selectedMonthId) return;
      const { data } = await supabase
        .from("budgets")
        .select("id, category_id, expected_amount, categories(id, name, type)")
        .eq("month_id", selectedMonthId);
      setBudgets(data ?? []);
    };
    fetchBudgets();
  }, [selectedMonthId, supabase]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔹 Add or Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;
    if (!userId || !selectedMonthId) return alert("Not logged in");

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
        console.error(error);
        alert("Error updating budget");
      } else {
        alert("Budget updated!");
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
        console.error(error);
        alert("Error adding budget");
      } else {
        alert("Budget added!");
      }
    }

    setForm({ category_id: "", expected_amount: "" });

    const { data } = await supabase
      .from("budgets")
      .select("id, category_id, expected_amount, categories(id, name, type)")
      .eq("month_id", selectedMonthId);
    setBudgets(data ?? []);
  };

  // 🔹 Edit
  const handleEdit = (b: Budget) => {
    setForm({
      category_id: b.category_id,
      expected_amount: b.expected_amount.toString(),
    });
    setEditingId(b.id);
  };

  // 🔹 Delete
  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (error) {
      console.error(error);
      alert("Error deleting budget");
    } else {
      alert("Budget deleted!");
      setBudgets(budgets.filter((b) => b.id !== id));
    }
  };

  return (
    <div className="p-4 bg-gray-50 space-y-4">
      <h2 className="text-xl font-semibold">Budgets</h2>

      {/* Month Selector */}
      <div>
        <label className="text-sm font-medium mr-2">Select Month:</label>
        <select
          value={selectedMonthId ?? ""}
          onChange={(e) => setSelectedMonthId(e.target.value)}
          className="border rounded p-1 text-sm"
        >
          {months.map((m) => (
            <option key={m.id} value={m.id}>
              {m.month}
            </option>
          ))}
        </select>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap gap-2 items-center bg-white p-2 shadow rounded"
      >
        <select
          name="category_id"
          value={form.category_id}
          onChange={handleChange}
          className="border rounded p-1 text-sm"
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
          value={form.expected_amount}
          onChange={handleChange}
          placeholder="Expected Amount"
          className="border rounded p-1 text-sm w-32"
          required
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
        >
          {editingId ? "Update" : "Add"}
        </button>
      </form>

      {/* Budgets List */}
      <div className="bg-white shadow rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-3 py-2 text-left">Category</th>
              <th className="px-3 py-2 text-right">Expected Amount</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {budgets.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-4 text-center text-gray-500">
                  No budgets yet
                </td>
              </tr>
            ) : (
              budgets.map((b) => (
                <tr key={b.id} className="border-t">
                  <td className="px-3 py-2">
                    {Array.isArray(b.categories) ? b.categories[0]?.name ?? "No category" : b.categories?.name ?? "No category"}
                    <span className="text-xs text-gray-500">
                      ({Array.isArray(b.categories) ? b.categories[0]?.type : b.categories?.type})
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    ₱{b.expected_amount.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(b)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}