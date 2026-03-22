"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bar, Pie } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { ChartOptions } from "chart.js";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ChartDataLabels);

const barOptions: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: "#fff", // legend text color
        font: {
          size: 14,
          weight: "bold",
        },
      },
    },
    tooltip: {
      titleColor: "#fff", // tooltip title text
      bodyColor: "#fff",  // tooltip body text
    },
  },
  scales: {
    x: {
      ticks: {
        color: "#fff", // x-axis labels
      },
      grid: {
        color: "rgba(255,255,255,0.2)", // x-axis grid lines
      },
    },
    y: {
      ticks: {
        color: "#fff", // y-axis labels
      },
      grid: {
        color: "rgba(255,255,255,0.2)", // y-axis grid lines
      },
    },
  },
};

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

type Transaction = {
  id: string;
  category_id: string;
  amount: number;
  categories?: Category | Category[];
};

type Month = {
  id: string;
  month: string;
};

export default function Dashboard() {
  const supabase = createClient();
  const [months, setMonths] = useState<Month[]>([]);
  const [selectedMonthId, setSelectedMonthId] = useState<string | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // 🔹 Fetch months list
  useEffect(() => {
    const fetchMonths = async () => {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;
      if (!userId) return;

      const { data: monthData } = await supabase
        .from("months")
        .select("id, month")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      setMonths(monthData ?? []);

      // Auto-select latest month
      if (monthData && monthData.length > 0) {
        setSelectedMonthId(monthData[0].id);
      }
    };

    fetchMonths();
  }, [supabase]);

  // 🔹 Fetch budgets + transactions when month changes
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedMonthId) return;

      const { data: budgetData } = await supabase
        .from("budgets")
        .select("id, category_id, expected_amount, categories(id, name, type)")
        .eq("month_id", selectedMonthId);

      setBudgets(budgetData ?? []);

      const { data: txData } = await supabase
        .from("transactions")
        .select("id, category_id, amount, categories(id, name, type)")
        .eq("month_id", selectedMonthId);

      setTransactions(txData ?? []);
    };

    fetchData();
  }, [selectedMonthId, supabase]);

  // 🔹 Aggregate totals
  const totals = {
    needs: { expected: 0, actual: 0 },
    wants: { expected: 0, actual: 0 },
    savings: { expected: 0, actual: 0 },
  };

  budgets.forEach((b) => {
    if (b.categories && !Array.isArray(b.categories)) {
      totals[b.categories.type].expected += b.expected_amount;
    }
  });

  transactions.forEach((t) => {
    if (t.categories && !Array.isArray(t.categories)) {
      totals[t.categories.type].actual += t.amount;
    }
  });

  // 🔹 Prepare data for Needs Bar Chart
  const needsBudgets = budgets.filter(
    (b): b is Budget & { categories: Category } =>
      b.categories !== undefined &&
      !Array.isArray(b.categories) &&
      b.categories.type === "needs"
  );

  const barDataNeeds = {
    labels: needsBudgets.map((b) => b.categories.name ?? "Unknown"),
    datasets: [
      {
        label: "Expected",
        data: needsBudgets.map((b) => b.expected_amount),
        backgroundColor: "rgba(54, 162, 235, 0.9)",
      },
      {
        label: "Actual",
        data: needsBudgets.map((b) =>
          transactions
            .filter((t) => t.category_id === b.category_id)
            .reduce((sum, t) => sum + t.amount, 0)
        ),
        backgroundColor: "rgba(255, 99, 132, 0.9)",
      },
    ],
  };

  // 🔹 Prepare data for Wants Bar Chart
  const wantsBudgets = budgets.filter(
    (b): b is Budget & { categories: Category } =>
      b.categories !== undefined &&
      !Array.isArray(b.categories) &&
      b.categories.type === "wants"
  );

  const barDataWants = {
    labels: wantsBudgets.map((b) => b.categories.name ?? "Unknown"),
    datasets: [
      {
        label: "Expected",
        data: wantsBudgets.map((b) => b.expected_amount),
        backgroundColor: "rgba(54, 162, 235, 0.9)",
      },
      {
        label: "Actual",
        data: wantsBudgets.map((b) =>
          transactions
            .filter((t) => t.category_id === b.category_id)
            .reduce((sum, t) => sum + t.amount, 0)
        ),
        backgroundColor: "rgba(255, 99, 132, 0.9)",
      },
    ],
  };

  // 🔹 Prepare data for Savings Bar Chart
  const savingsBudgets = budgets.filter(
    (b): b is Budget & { categories: Category } =>
      b.categories !== undefined &&
      !Array.isArray(b.categories) &&
      b.categories.type === "savings"
  );

  const barDataSavings = {
    labels: savingsBudgets.map((b) => b.categories.name ?? "Unknown"),
    datasets: [
      {
        label: "Expected",
        data: savingsBudgets.map((b) => b.expected_amount),
        backgroundColor: "rgba(54, 162, 235, 0.9)",
      },
      {
        label: "Actual",
        data: savingsBudgets.map((b) =>
          transactions
            .filter((t) => t.category_id === b.category_id)
            .reduce((sum, t) => sum + t.amount, 0)
        ),
        backgroundColor: "rgba(255, 99, 132, 0.9)",
      },
    ],
  };

  const pieData = {
    labels: ["Needs", "Wants", "Savings"],
    datasets: [
      {
        data: [totals.needs.actual, totals.wants.actual, totals.savings.actual],
        backgroundColor: ["#36A2EB", "#FFCE56", "#FF6384"],
      },
    ],
  };

  return (
    <div className="p-6 bg-sky-950 min-h-screen text-white space-y-8">
      <h2 className="text-2xl font-bold tracking-wide">Dashboard</h2>

      {/* Month Selector */}
      <div className="flex items-center justify-between bg-sky-900 p-4 rounded-lg shadow-md">
        <label className="text-sm font-semibold">Select Month:</label>
        <select
          value={selectedMonthId ?? ""}
          onChange={(e) => setSelectedMonthId(e.target.value)}
          className="rounded-md bg-sky-800 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-400"
        >
          {months.map((m) => (
            <option key={m.id} value={m.id}>
              {m.month}
            </option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(["needs", "wants", "savings"] as const).map((type) => (
          <div
            key={type}
            className="bg-sky-900 rounded-lg shadow-lg p-5 border border-sky-700 hover:scale-105 transition-transform"
          >
            <h3 className="text-lg font-semibold capitalize text-sky-100">{type}</h3>
            <p className="text-sm text-sky-200 mt-2">
              Expected: <span className="font-bold text-green-400">₱{totals[type].expected.toFixed(0)}</span>
            </p>
            <p className="text-sm text-sky-200">
              Actual: <span className="font-bold text-pink-400">₱{totals[type].actual.toFixed(0)}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Bar Chart for Needs */}
      <div className="bg-sky-900 rounded-lg shadow-lg p-6">
        <h3 className="text-base font-semibold mb-3 text-sky-00">Expected vs Actual (Needs)</h3>
        <div className="h-64 w-full">
          <Bar
            data={barDataNeeds}
            options={barOptions} />
        </div>
      </div>

      {/* Bar Chart for Wants */}
      <div className="bg-sky-900 rounded-lg shadow-lg p-6">
        <h3 className="text-base font-semibold mb-3 text-sky-00">Expected vs Actual (Wants)</h3>
        <div className="h-64 w-full">
          <Bar
            data={barDataWants}
            options={barOptions}
          />
        </div>
      </div>

      {/* Bar Chart for Savings */}
      <div className="bg-sky-900 rounded-lg shadow-lg p-6">
        <h3 className="text-base font-semibold mb-3 text-sky-00">Expected vs Actual (Savings)</h3>
        <div className="h-64 w-full">
          <Bar data={barDataSavings} options={barOptions} />
        </div>
      </div>

      {/* Pie Chart */}
      <div className="bg-sky-900 rounded-lg shadow-lg p-6">
        <h3 className="text-base font-semibold mb-3 text-sky-100">Spending Breakdown</h3>
        <div className="h-64 w-full flex justify-center">
          <Pie
            data={pieData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: "bottom", labels: { color: "#fff" } },
                datalabels: {
                  color: "#fff",
                  font: { weight: "bold", size: 12 },
                  formatter: (value: number, context) => {
                    const data = context.chart.data.datasets[0].data as number[];
                    const total = data.reduce((a, b) => a + b, 0);
                    const percentage = total ? ((value / total) * 100).toFixed(1) : 0;
                    return `${percentage}%`;
                  },
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}