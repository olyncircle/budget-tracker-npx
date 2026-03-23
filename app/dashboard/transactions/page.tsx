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

type Transaction = {
  id: string;
  date: string;
  amount: number;
  note: string | null;
  category_id: string;
  categories?: Category | Category[];
};

export default function TransactionsPageLogic() {
  const supabase = createClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const today = new Date();
  const localDate = today.toLocaleDateString("en-CA"); // YYYY-MM-DD format

  const [form, setForm] = useState({
    date: localDate,
    amount: "",
    category_id: "",
    note: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = transactions.slice(startIndex, startIndex + itemsPerPage);

  // Fetch transactions + categories
  useEffect(() => {
    const fetchData = async () => {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;
      if (!userId) return;

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

      const { data: txData, error: txError } = await supabase
        .from("transactions")
        .select(`
            id,
            date,
            amount,
            note,
            category_id,
            categories!transactions_category_id_fkey (id, name, type)
          `)
        .eq("month_id", month.id)
        .order("created_at", { ascending: false }); // newest first

      if (txError) {
        toast.error(txError.message);
      }
      setTransactions((txData ?? []) as Transaction[]);

      const { data: catData } = await supabase.from("categories").select("*");
      setCategories(catData ?? []);
      setCurrentPage(1);
    };

    fetchData();
  }, [supabase]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Add or Update transaction
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;
    if (!userId) return toast.error("Not logged in");

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

      if (error) toast.error(error.message);
      else {
        toast.success("Transaction updated!");
        setEditingId(null);
      }
    } else {
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

      if (error) toast.error(error.message);
      else toast.success("Transaction added!");
    }

    setForm({ date: localDate, amount: "", category_id: "", note: "" });

    const { data: txData, error: txError } = await supabase
      .from("transactions")
      .select(`
            id,
            date,
            amount,
            note,
            category_id,
            categories!transactions_category_id_fkey (id, name, type)
          `)
      .eq("month_id", month.id)
      .order("created_at", { ascending: false }); // newest first
    if (txError) {
      toast.error(txError.message);
    }
    setTransactions((txData ?? []) as Transaction[]);
  };

  // Edit
  const handleEdit = (tx: Transaction) => {
    setForm({
      date: tx.date,
      amount: tx.amount.toString(),
      category_id: tx.category_id,
      note: tx.note ?? "",
    });
    setEditingId(tx.id);
  };

  // Delete
  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Transaction deleted!");
      setTransactions(transactions.filter((t) => t.id !== id));
    }
  };

  return (
    <div className="p-6 bg-sky-950 min-h-screen text-white space-y-6">
      <h2 className="text-2xl font-bold tracking-wide">Transactions</h2>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap gap-3 items-center bg-sky-900 p-4 rounded-lg shadow-md"
      >
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          className="rounded-md bg-sky-950 px-3 py-2 text-sm text-white"
        />
        <input
          type="number"
          name="amount"
          value={form.amount}
          onChange={handleChange}
          placeholder="Amount"
          className="rounded-md bg-sky-950 px-3 py-2 text-sm text-white w-28"
        />
        <select
          name="category_id"
          value={form.category_id}
          onChange={handleChange}
          className="rounded-md bg-sky-950 px-3 py-2 text-sm text-white"
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
          className="rounded-md bg-sky-950 px-3 py-2 text-sm text-white flex-1"
        />
        <button
          type="submit"
          className="bg-teal-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-teal-500 focus:ring-2 focus:ring-teal-400"
        >
          {editingId ? "Update" : "Add"}
        </button>
      </form>

      {/* Transactions Table */}
      <div className="overflow-x-auto bg-sky-900 rounded-lg shadow-md">
        <table className="min-w-full text-sm">
          <thead className="bg-sky-800 text-gray-200">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Category</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2 text-left">Note</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-gray-500">
                  No transactions yet
                </td>
              </tr>
            ) : (
              currentItems.map((t) => (
                <tr
                  key={t.id}
                  className="border-t border-sky-700 hover:bg-sky-800 transition-colors"
                >
                  <td className="px-3 py-2">{t.date}</td>
                  <td className="px-3 py-2">
                    {Array.isArray(t.categories)
                      ? t.categories[0]?.name
                      : t.categories?.name}
                  </td>
                  <td className="px-3 py-2 capitalize text-gray-300">
                    {Array.isArray(t.categories)
                      ? t.categories[0]?.type
                      : t.categories?.type}
                  </td>
                  <td className="px-3 py-2 text-right">
                    ₱{t.amount.toFixed(2)}
                  </td>
                  <td className="px-3 py-2">{t.note ?? "-"}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleEdit(t)}
                        className="w-9 h-9 flex items-center justify-center rounded-md bg-amber-600 text-white hover:bg-amber-500 focus:ring-2 focus:ring-amber-400"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDelete(t.id)}
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
            className="px-3 py-1 rounded-md bg-sky-600 text-white disabled:opacity-50"
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
            className="px-3 py-1 rounded-md bg-sky-600 text-white disabled:opacity-50"
          >
            次
          </button>
        </div>
      </div>
    </div>
  );
}