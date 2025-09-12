import { useTranslation } from '../hooks/useTranslation';

// We cannot use the useTranslation hook directly in a non-component function.
// Instead, the component calling this function will catch the error key and translate it.
export const fetchUrlContent = async (urlInput: string): Promise<string> => {
    try {
        const url = new URL(urlInput.startsWith('http') ? urlInput : `https://${urlInput}`);
        const response = await fetch(url.href);
        if (!response.ok) {
            // Throw a generic error for any non-2xx response.
            // This simplifies handling in the component.
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const textContent = await response.text();
        return textContent;
    } catch (e) {
        console.error("URL Fetch error:", e);
        if (e instanceof TypeError) {
            // This error is typically thrown by `new URL()` for malformed URLs.
            throw new Error("error_invalid_url");
        }
        // For fetch errors (network issues, CORS, etc.) or HTTP errors.
        throw new Error("error_fetch_url");
    }
};
