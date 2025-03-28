"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-sm p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="font-bold text-xl">
          Data Platform
        </Link>
        <div className="space-x-4">
          <Link
            href="/notebook"
            className={`px-3 py-2 rounded-md ${
              pathname === "/notebook"
                ? "bg-blue-100 text-blue-800"
                : "hover:bg-gray-100"
            }`}
          >
            Notebook
          </Link>
          <Link
            href="/dashboard"
            className={`px-3 py-2 rounded-md ${
              pathname === "/dashboard"
                ? "bg-blue-100 text-blue-800"
                : "hover:bg-gray-100"
            }`}
          >
            Dashboard
          </Link>
        </div>
      </div>
    </nav>
  );
}
