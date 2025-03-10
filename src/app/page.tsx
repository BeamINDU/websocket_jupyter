"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// ใช้ dynamic import เพื่อให้โค้ดทำงานเฉพาะฝั่ง client
const MultiCellNotebook = dynamic(
  () => import("@/components/MultiCellNotebook"),
  { ssr: false, loading: () => <div>กำลังโหลด Jupyter Notebook...</div> }
);

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <main style={{ padding: "20px" }}>
      <MultiCellNotebook />
    </main>
  );
}
