"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";


type Category = {
  id: string;
  name: string;
  type: "needs" | "wants" | "savings";
};

export default function CategoriesPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: "", type: "needs" });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(categories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = categories.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    const fetchCategories = async () => {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;
      if (!userId) return;

      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      setCategories(data ?? []);
      setCurrentPage(1); // reset pagination
    };
    fetchCategories();
  }, [supabase]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;
    if (!userId) return toast.error("Not logged in");

    if (editingId) {
      const { error } = await supabase
        .from("categories")
        .update({ name: form.name, type: form.type })
        .eq("id", editingId)
        .eq("user_id", userId);

      if (error) toast.error(error.message);
      else {
        toast.success("Category updated!");
        setEditingId(null);
      }
    } else {
      const { error } = await supabase.from("categories").insert([
        { user_id: userId, name: form.name, type: form.type },
      ]);
      if (error) toast.error(error.message);
      else toast.success("Category added!");
    }

    setForm({ name: "", type: "needs" });

    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setCategories(data ?? []);
  };

  const handleEdit = (cat: Category) => {
    setForm({ name: cat.name, type: cat.type });
    setEditingId(cat.id);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Category deleted!");
      setCategories(categories.filter((c) => c.id !== id));
    }
  };

  return (
    <div className="p-6 bg-sky-950 min-h-screen text-white space-y-6">
      <h2 className="text-2xl font-bold tracking-wide">Manage Categories</h2>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap gap-3 items-center bg-sky-900 p-4 rounded-lg shadow-md"
      >
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Category name"
          className="rounded-md bg-sky-950 px-3 py-2 text-sm text-white flex-1"
          required
        />
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="rounded-md bg-sky-950 px-3 py-2 text-sm text-white"
        >
          <option value="needs">Needs</option>
          <option value="wants">Wants</option>
          <option value="savings">Savings</option>
        </select>
        <button
          type="submit"
          className="bg-teal-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-teal-500 focus:ring-2 focus:ring-teal-400"
        >
          {editingId ? "Update" : "Add"}
        </button>
      </form>

      {/* Category List */}
      <div className="overflow-x-auto bg-sky-900 rounded-lg shadow-md">
        <table className="min-w-full text-sm">
          <thead className="bg-sky-800 text-gray-200">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-3 py-4 text-center text-gray-500"
                >
                  No categories yet
                </td>
              </tr>
            ) : (
              currentItems.map((cat) => (
                <tr
                  key={cat.id}
                  className="border-t border-sky-700 hover:bg-sky-800 transition-colors"
                >
                  <td className="px-3 py-2">{cat.name}</td>
                  <td className="px-3 py-2 capitalize">{cat.type}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleEdit(cat)}
                        className="w-9 h-9 flex items-center justify-center rounded-md bg-amber-600 text-white hover:bg-amber-500 focus:ring-2 focus:ring-amber-400"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDelete(cat.id)}
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