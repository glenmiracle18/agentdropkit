// ListingGrid is now a TanStack Query client component that owns its own
// loading and placeholder state via keepPreviousData + isFetching, so this
// wrapper just renders its children.
export function SearchResultsArea({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
