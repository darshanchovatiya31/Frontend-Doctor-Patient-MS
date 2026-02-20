import React from "react";
import GridShape from "../../components/common/GridShape";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6 sm:p-8">
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 md:p-10">
        {/* Optional GridShape for subtle background pattern */}
        <div className="absolute inset-0 opacity-10 dark:opacity-5">
          <GridShape />
        </div>
        {children}
      </div>
      <div className="fixed z-50 bottom-6 right-6">
        <ThemeTogglerTwo />
      </div>
    </div>
  );
}