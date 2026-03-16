"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSearchState } from "./search-state-provider";

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export default function HeroSearch() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { startSearchTransition } = useSearchState();
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

    // Debounce the search query with 500ms delay
    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    // Effect to trigger search when debounced value changes
    useEffect(() => {
        const currentSearch = searchParams.get("search");

        // Only update if the debounced value is different from current URL param
        if (currentSearch !== debouncedSearchQuery) {
            const params = new URLSearchParams(searchParams);
            if (debouncedSearchQuery) {
                params.set("search", debouncedSearchQuery);
            } else {
                params.delete("search");
            }
            startSearchTransition(() => {
                router.push(`?${params.toString()}`);
            });
        }
    }, [debouncedSearchQuery, router]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Force immediate search on submit
        const params = new URLSearchParams(searchParams);
        if (searchQuery) {
            params.set("search", searchQuery);
        } else {
            params.delete("search");
        }
        startSearchTransition(() => {
            router.push(`?${params.toString()}`);
        });
    };

    return (
        <form
            onSubmit={handleSearchSubmit}
            className="relative max-w-3xl flex flex-col sm:flex-row shadow-[4px_4px_0px_0px_var(--color-text-primary)] md:shadow-[8px_8px_0px_0px_var(--color-text-primary)] border-[3px] border-border bg-bg-card"
        >
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted hidden sm:block">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
            </div>
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search through 1,000+ skills..."
                className="w-full bg-bg-card text-text-primary px-4 sm:pl-16 sm:pr-6 py-4 md:py-5 focus:outline-none text-base md:text-lg font-mono placeholder-text-muted"
            />
            <button
                type="submit"
                className="flex items-center justify-center gap-2 bg-text-primary text-bg-base px-8 py-4 md:py-5 border-t-[3px] sm:border-y-0 sm:border-l-[3px] border-border hover:bg-text-muted transition-colors font-bold uppercase tracking-widest font-mono"
            >
                Search
            </button>
        </form>
    );
}
