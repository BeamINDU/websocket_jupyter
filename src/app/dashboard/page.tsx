"use client";

import React, { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import DashboardEmbed from "@/components/DashboardEmbed";

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <Navigation />
      <main style={{ padding: "0", height: "calc(100vh - 60px)" }}>
        <DashboardEmbed />
      </main>
    </>
  );
}
