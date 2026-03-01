"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

const navItems = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Budgets", href: "/dashboard/budget" },
    { name: "Transactions", href: "/dashboard/transactions" },
    { name: "Categories", href: "/dashboard/categories" },
];

export default function Navbar() {
    const pathname = usePathname();

    return (
        <nav className="bg-white shadow-sm border-b">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex h-14 items-center justify-between">

                    {/* Logo / Title */}
                    <div className="text-lg font-semibold">
                        💸 orinsama finance tracker 💸
                    </div>

                    {/* Links */}
                    <div className="flex space-x-6 text-sm font-medium">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`transition-colors ${isActive
                                        ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                                        : "text-gray-600 hover:text-blue-600"
                                        }`}
                                >
                                    {item.name}
                                </Link>
                            );
                        })}
                        {/* Logout */}
                        <LogoutButton />
                    </div>
                </div>
            </div>
        </nav>
    );
}