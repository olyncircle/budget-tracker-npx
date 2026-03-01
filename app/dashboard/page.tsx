"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bar, Pie } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
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

  // 🔹 Chart Data
  const barData = {
    labels: budgets.map((b) => {
      if (Array.isArray(b.categories)) {
        return b.categories[0]?.name ?? "Unknown";
      }
      return b.categories?.name ?? "Unknown";
    }),
    datasets: [
      {
        label: "Expected",
        data: budgets.map((b) => b.expected_amount),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
      },
      {
        label: "Actual",
        data: budgets.map((b) =>
          transactions
            .filter((t) => t.category_id === b.category_id)
            .reduce((sum, t) => sum + t.amount, 0)
        ),
        backgroundColor: "rgba(255, 99, 132, 0.6)",
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
    <div className="space-y-4 p-4 bg-gray-50">
      <h2 className="text-xl font-semibold">Dashboard</h2>

      {/* Month Selector */}
      <div className="mb-4">
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

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 text-sm">
        {(["needs", "wants", "savings"] as const).map((type) => (
          <div key={type} className="bg-white shadow rounded p-2">
            <h3 className="font-medium capitalize">{type}</h3>
            <p>Expected: ₱{totals[type].expected.toFixed(0)}</p>
            <p>Actual: ₱{totals[type].actual.toFixed(0)}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="bg-white shadow rounded p-4">
        <h3 className="text-sm font-medium mb-2">Expected vs Actual</h3>
        <div className="h-48 w-full"> {/* smaller height */}
          <Bar
            data={barData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
            }}
          />
        </div>
      </div>

      <div className="h-48 w-full flex justify-center">
        <Pie
          data={pieData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "bottom",
              },
              datalabels: {
                color: "#fff",
                font: {
                  weight: "bold",
                  size: 12,
                },
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
  );
}