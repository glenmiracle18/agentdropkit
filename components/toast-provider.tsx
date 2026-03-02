"use client";

import { Toaster } from "sileo";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ToastProvider() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        // Return a default toaster to avoid hydration mismatch, or null
        return <Toaster position="bottom-center" />;
    }

    const isDark = resolvedTheme === "dark";

    return (
        <Toaster
            position="bottom-center"
            options={{
                fill: isDark ? "#FFFDF9" : "#1C1917",
                styles: {
                    title: isDark ? "text-[#1C1917]!" : "text-[#FFFDF9]!",
                    description: isDark ? "text-[#1C1917]/75!" : "text-[#FFFDF9]/75!",
                    button: isDark
                        ? "bg-black/5! hover:bg-black/10! text-[#1C1917]!"
                        : "bg-white/10! hover:bg-white/15! text-[#FFFDF9]!",
                },
            }}
        />
    );
}
