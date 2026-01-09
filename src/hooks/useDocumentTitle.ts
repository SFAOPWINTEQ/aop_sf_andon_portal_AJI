import { useEffect } from "react";

/**
 * Custom hook to dynamically set the document title
 * @param title - The title to set (will be appended with " | Admin Basis")
 */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `${title} | Admin Basis` : "Admin Basis";

    return () => {
      document.title = prevTitle;
    };
  }, [title]);
}
