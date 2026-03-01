"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Category = {
  id: string;
  name: string;
  type: "needs" | "wants" | "savings";
};

type Transaction = {
  id: string;
  date: string;
  amount: number;
  note: string | null;
  category_id: string;
  categories?: Category | Category[];
};

export default function TransactionsPage() {
  const supabase = createClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    date: "",
    amount: "",
    category_id: "",
    note: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // 🔹 Fetch transactions + categories
  useEffect(() => {
    const fetchData = async () => {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;
      if (!userId) return;

      // Get current month
      const currentMonth = new Date().toLocaleString("default", {
        month: "long",
        year: "numeric",
      });

      const { data: month } = await supabase
        .from("months")
        .select("id")
        .eq("user_id", userId)
        .eq("month", currentMonth)
        .single();

      if (!month) return;

      const { data: txData } = await supabase
        .from("transactions")
        .select("id, date, amount, note, category_id, categories(id, name, type)")
        .eq("month_id", month.id)
        .order("date", { ascending: true });

      setTransactions((txData ?? []) as Transaction[]);

      const { data: catData } = await supabase.from("categories").select("*");
      setCategories(catData ?? []);
    };

    fetchData();
  }, [supabase]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔹 Add or Update transaction
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;
    if (!userId) return alert("Not logged in");

    // Ensure month exists
    const currentMonth = new Date().toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    const { data: month } = await supabase
      .from("months")
      .select("id")
      .eq("user_id", userId)
      .eq("month", currentMonth)
      .single();

    if (!month) return;

    if (editingId) {
      // Update
      const { error } = await supabase
        .from("transactions")
        .update({
          date: form.date,
          amount: Number(form.amount),
          category_id: form.category_id,
          note: form.note,
        })
        .eq("id", editingId)
        .eq("user_id", userId);

      if (error) {
        console.error(error);
        alert("Error updating transaction");
      } else {
        alert("Transaction updated!");
        setEditingId(null);
      }
    } else {
      // Insert
      const { error } = await supabase.from("transactions").insert([
        {
          user_id: userId,
          month_id: month.id,
          category_id: form.category_id,
          date: form.date,
          amount: Number(form.amount),
          note: form.note,
        },
      ]);

      if (error) {
        console.error(error);
        alert("Error adding transaction");
      } else {
        alert("Transaction added!");
      }
    }

    setForm({ date: "", amount: "", category_id: "", note: "" });

    // Refresh list
    const { data: txData } = await supabase
      .from("transactions")
      .select("id, date, amount, note, category_id, categories(id, name, type)")
      .eq("month_id", month.id)
      .order("date", { ascending: true });

    setTransactions(txData ?? []);
  };

  // 🔹 Edit
  const handleEdit = (tx: Transaction) => {
    setForm({
      date: tx.date,
      amount: tx.amount.toString(),
      category_id: tx.category_id,
      note: tx.note ?? "",
    });
    setEditingId(tx.id);
  };

  // 🔹 Delete
  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) {
      console.error(error);
      alert("Error deleting transaction");
    } else {
      alert("Transaction deleted!");
      setTransactions(transactions.filter((t) => t.id !== id));
    }
  };

  return (
    <div className="p-4 bg-gray-50 space-y-4">
      <h2 className="text-xl font-semibold">Transactions</h2>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap gap-2 items-center bg-white p-2 shadow rounded"
      >
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          className="border rounded p-1 text-sm"
          required
        />
        <input
          type="number"
          name="amount"
          value={form.amount}
          onChange={handleChange}
          placeholder="Amount"
          className="border rounded p-1 text-sm w-24"
          required
        />
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
          type="text"
          name="note"
          value={form.note}
          onChange={handleChange}
          placeholder="Note"
          className="border rounded p-1 text-sm flex-1"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
        >
          {editingId ? "Update" : "Add"}
        </button>
      </form>

      {/* Transactions List */}
      <div className="bg-white shadow rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Category</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2 text-left">Note</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-gray-500">
                  No transactions yet
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="px-3 py-2">{t.date}</td>
                  <td className="px-3 py-2">
                    {Array.isArray(t.categories) ? t.categories[0]?.name : t.categories?.name}{" "}
                    <span className="text-xs text-gray-500">
                      ({Array.isArray(t.categories) ? t.categories[0]?.type : t.categories?.type})
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">₱{t.amount.toFixed(2)}</td>
                  <td className="px-3 py-2">{t.note ?? "-"}</td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(t)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
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