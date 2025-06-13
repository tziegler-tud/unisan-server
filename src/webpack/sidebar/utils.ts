export async function getTemplate(templateUrl: string): Promise<string> {
    try {
        const response = await fetch(templateUrl);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const json = await response.json();
        return response.json();
    } catch (error) {
        console.error(error.message);
    }
}

export async function fetchData(url: string): Promise<JSON> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const json = await response.json();
        return response.json();
    } catch (error) {
        console.error(error.message);
    }
}