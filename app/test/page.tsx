"use client";

export default function ResponsiveTable() {
  const data = [
    { category: "Food", amount: "$120", date: "2026-03-20" },
    { category: "Transport", amount: "$45", date: "2026-03-19" },
    { category: "Utilities", amount: "$80", date: "2026-03-18" },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-700 bg-blue-950 text-white rounded-lg shadow-md">
        <thead className="bg-blue-900">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-sm font-semibold">
              Category
            </th>
            <th scope="col" className="px-6 py-3 text-left text-sm font-semibold">
              Amount
            </th>
            <th scope="col" className="px-6 py-3 text-left text-sm font-semibold">
              Date
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {data.map((item, idx) => (
            <tr key={idx} className="hover:bg-blue-800 transition-colors">
              <td className="px-6 py-4 text-sm">{item.category}</td>
              <td className="px-6 py-4 text-sm">{item.amount}</td>
              <td className="px-6 py-4 text-sm">{item.date}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile-friendly cards */}
      <div className="mt-6 grid gap-4 sm:hidden">
        {data.map((item, idx) => (
          <div
            key={idx}
            className="rounded-lg bg-blue-900 p-4 shadow-md text-white"
          >
            <p className="text-sm font-semibold">{item.category}</p>
            <p className="text-sm">Amount: {item.amount}</p>
            <p className="text-sm">Date: {item.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
}