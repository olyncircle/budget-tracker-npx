"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Category = {
  id: string;
  name: string;
  type: "needs" | "wants" | "savings";
};

export default function CategoryForm() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: "", type: "needs" });
  const [editingId, setEditingId] = useState<string | null>(null);

  // 🔹 Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from("categories").select("*");
      setCategories(data ?? []);
    };
    fetchCategories();
  }, []);

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
    if (!userId) return alert("Not logged in");

    if (editingId) {
      // Update
      const { error } = await supabase
        .from("categories")
        .update({ name: form.name, type: form.type })
        .eq("id", editingId)
        .eq("user_id", userId);

      if (error) {
        console.error(error);
        alert("Error updating category");
      } else {
        alert("Category updated!");
        setEditingId(null);
      }
    } else {
      // Insert
      const { error } = await supabase.from("categories").insert([
        { user_id: userId, name: form.name, type: form.type },
      ]);

      if (error) {
        console.error(error);
        alert("Error adding category");
      } else {
        alert("Category added!");
      }
    }

    setForm({ name: "", type: "needs" });
    const { data } = await supabase.from("categories").select("*");
    setCategories(data ?? []);
  };

  // 🔹 Edit
  const handleEdit = (cat: Category) => {
    setForm({ name: cat.name, type: cat.type });
    setEditingId(cat.id);
  };

  // 🔹 Delete
  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      console.error(error);
      alert("Error deleting category");
    } else {
      alert("Category deleted!");
      setCategories(categories.filter((c) => c.id !== id));
    }
  };

  return (
    <div className="p-4 bg-gray-50 space-y-4">
      <h2 className="text-xl font-semibold">Manage Categories</h2>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 items-center bg-white p-2 shadow rounded"
      >
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Category name"
          className="border rounded p-1 text-sm flex-1"
          required
        />
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="border rounded p-1 text-sm"
        >
          <option value="needs">Needs</option>
          <option value="wants">Wants</option>
          <option value="savings">Savings</option>
        </select>
        <button
          type="submit"
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
        >
          {editingId ? "Update" : "Add"}
        </button>
      </form>

      {/* Category List */}
      <div className="bg-white shadow rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-4 text-center text-gray-500">
                  No categories yet
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="border-t">
                  <td className="px-3 py-2">{cat.name}</td>
                  <td className="px-3 py-2 capitalize">{cat.type}</td>
                  <td className="px-3 py-2 text-right space-x-3">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
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