const BASE_URL = "http://192.168.0.173:8081"; // change port if needed

export const fetchAPI = async (url: string, options?: RequestInit) => {
    try {
        const fullUrl = `${BASE_URL}${url}`;
        const response = await fetch(fullUrl, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Fetch error:", error);
        throw error;
    }
};
