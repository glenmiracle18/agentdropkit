"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

interface LogoProps {
    size?: string;
}

export default function AgentDropkitLogo({ size = "30px" }: LogoProps) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div style={{ width: size, height: size }} aria-hidden="true" />;
    }

    return resolvedTheme === "light" ? (
        // Light mode logo (dark dots)
        <svg width={size} height={size} viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
            <g fill="none" className="nc-icon-wrapper" strokeLinejoin="miter" strokeLinecap="butt">
                <path d="M3 7H3.01" stroke="#1c1f21" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M3 11H3.01" stroke="#1c1f2100" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M3 15H3.01" stroke="#1c1f2100" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M3 19H3.01" stroke="#1c1f2100" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M3 23H3.01" stroke="#1c1f21" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M3 27H3.01" stroke="#1c1f2100" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M7 7H7.01" stroke="#1c1f21" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M7 11H7.01" stroke="#1c1f21" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M7 15H7.01" stroke="#1c1f21" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M7 19H7.01" stroke="#1c1f21" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M7 23H7.01" stroke="#1c1f21" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M7 27H7.01" stroke="#1c1f21" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M11 7H11.01" stroke="#1c1f21" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M11 11H11.01" stroke="#1c1f2100" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M11 15H11.01" stroke="#1c1f2140" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M11 19H11.01" stroke="#1c1f2140" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M11 23H11.01" stroke="#1c1f21" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M10.99 27H11" stroke="#1c1f2100" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M15 7H15.01" stroke="#1c1f21" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M15 11H15.01" stroke="#1c1f2100" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M15 15H15.01" stroke="#1c1f2100" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M15 19H15.01" stroke="#1c1f2140" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M15 23H15.01" stroke="#1c1f21" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M15 27H15.01" stroke="#1c1f2100" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M19 7H19.01" stroke="#1c1f21" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M19 11H19.01" stroke="#1c1f2100" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M19 15H19.01" stroke="#1c1f2100" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M19 19H19.01" stroke="#1c1f2100" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M19 23H19.01" stroke="#1c1f21" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M19 27H19.01" stroke="#1c1f2100" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M23 7H23.01" stroke="#1c1f21" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M23 11H23.01" stroke="#1c1f21" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M7 3H7.01" stroke="#1c1f21" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M3 3H3.01" stroke="#1c1f2100" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M11 3H11.01" stroke="#1c1f2100" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M15 3H15.01" stroke="#1c1f2100" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M19 3H19.01" stroke="#1c1f2100" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M23 3H23.01" stroke="#1c1f21" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M27 3H27.01" stroke="#1c1f2100" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M23 15H23.01" stroke="#1c1f21" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M23 19H23.01" stroke="#1c1f21" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M23 23H23.01" stroke="#1c1f21" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M27 27H27.01" stroke="#1c1f2100" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M23 27H23.01" stroke="#1c1f21" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M27 7H27.01" stroke="#1c1f21" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M27 11H27.01" stroke="#1c1f2100" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M27 15H27.01" stroke="#1c1f2100" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M27 19H27.01" stroke="#1c1f2100" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M27 23H27.01" stroke="#1c1f21" strokeWidth="4" strokeLinecap="square"></path>
            </g>
        </svg>
    ) : (
        // Dark mode logo (light dots)
        <svg width={size} height={size} viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
            <g fill="none" className="nc-icon-wrapper" strokeLinejoin="miter" strokeLinecap="butt">
                <path d="M3 7H3.01" stroke="#f7f8f8" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M3 11H3.01" stroke="#f7f8f800" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M3 15H3.01" stroke="#f7f8f800" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M3 19H3.01" stroke="#f7f8f800" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M3 23H3.01" stroke="#f7f8f8" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M3 27H3.01" stroke="#f7f8f800" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M7 7H7.01" stroke="#f7f8f8" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M7 11H7.01" stroke="#f7f8f8" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M7 15H7.01" stroke="#f7f8f8" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M7 19H7.01" stroke="#f7f8f8" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M7 23H7.01" stroke="#f7f8f8" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M7 27H7.01" stroke="#f7f8f8" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M11 7H11.01" stroke="#f7f8f8" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M11 11H11.01" stroke="#f7f8f800" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M11 15H11.01" stroke="#f7f8f840" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M11 19H11.01" stroke="#f7f8f840" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M11 23H11.01" stroke="#f7f8f8" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M10.99 27H11" stroke="#f7f8f800" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M15 7H15.01" stroke="#f7f8f8" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M15 11H15.01" stroke="#f7f8f800" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M15 15H15.01" stroke="#f7f8f800" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M15 19H15.01" stroke="#f7f8f840" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M15 23H15.01" stroke="#f7f8f8" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M15 27H15.01" stroke="#f7f8f800" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M19 7H19.01" stroke="#f7f8f8" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M19 11H19.01" stroke="#f7f8f800" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M19 15H19.01" stroke="#f7f8f800" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M19 19H19.01" stroke="#f7f8f800" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M19 23H19.01" stroke="#f7f8f8" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M19 27H19.01" stroke="#f7f8f800" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M23 7H23.01" stroke="#f7f8f8" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M23 11H23.01" stroke="#f7f8f8" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M7 3H7.01" stroke="#f7f8f8" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M3 3H3.01" stroke="#f7f8f800" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M11 3H11.01" stroke="#f7f8f800" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M15 3H15.01" stroke="#f7f8f800" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M19 3H19.01" stroke="#f7f8f800" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M23 3H23.01" stroke="#f7f8f8" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M27 3H27.01" stroke="#f7f8f800" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M23 15H23.01" stroke="#f7f8f8" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M23 19H23.01" stroke="#f7f8f8" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M23 23H23.01" stroke="#f7f8f8" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M27 27H27.01" stroke="#f7f8f800" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M23 27H23.01" stroke="#f7f8f8" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M27 7H27.01" stroke="#f7f8f8" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M27 11H27.01" stroke="#f7f8f800" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M27 15H27.01" stroke="#f7f8f800" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M27 19H27.01" stroke="#f7f8f800" strokeWidth="4" strokeLinecap="square"></path>
                <path d="M27 23H27.01" stroke="#f7f8f8" strokeWidth="4" strokeLinecap="square"></path>
            </g>
        </svg>
    );
}
