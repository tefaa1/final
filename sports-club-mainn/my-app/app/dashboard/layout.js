"use client";
import React, { useState, useEffect } from "react";
import Sidebar from "@/src/components/Sidebar";
import Navbar from "@/src/components/Navbar";
import { usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const currentPage = pathname.split("/").pop() || "Dashboard";
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const sidebarWidth = isSidebarOpen ? "256px" : "64px";

  return (
    <>
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"></link>
      <link
        rel='stylesheet'
        href='https://cdn-uicons.flaticon.com/2.1.0/uicons-regular-rounded/css/uicons-regular-rounded.css'
      />

      {/* Sidebar — fixed */}
      <div
        className="fixed top-0 left-0 h-screen z-20 transition-all duration-300"
        style={{ width: sidebarWidth }}
      >
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          onSidebarToggle={() => setIsSidebarOpen((s) => !s)}
        />
      </div>

      {/* Main content */}
      <div
        className="flex flex-col min-h-screen bg-[var(--bg)] transition-all duration-300"
        style={{ marginLeft: sidebarWidth }}
      >
        <Navbar isSidebarOpen={isSidebarOpen} currentPage={currentPage} />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: "10px", background: "#2563eb", color: "#fff" },
        }}
      />
    </>
  );
}