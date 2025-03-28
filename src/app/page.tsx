"use client";

import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Data Analysis Platform</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Link
          href="/notebook"
          className="p-6 border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-2xl font-semibold mb-2">Jupyter Notebook</h2>
          <p>Interactive Python code execution with rich output display</p>
        </Link>
        <Link
          href="/dashboard"
          className="p-6 border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-2xl font-semibold mb-2">Data Dashboard</h2>
          <p>Interactive data visualization and analysis dashboards</p>
        </Link>
      </div>
    </main>
  );
}
