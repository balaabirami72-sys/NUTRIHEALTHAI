import { supabase } from '../integrations/supabase/client'; // Adjust path if your Supabase client lives in lib/ or integrations/

const USDA_API_KEY = import.meta.env.VITE_USDA_API_KEY;

export async function searchFood(query) {
    try {
        if (!query) return [];

        // 1. Search local Supabase database
        const { data: localResults, error } = await supabase
            .from('foods')
            .select('*')
            .textSearch('name', query, { config: 'english' });

        if (error) {
            console.error('Supabase search error:', error);
        }

        // If results exist in your DB, return them
        if (localResults && localResults.length > 0) {
            return { source: 'database', data: localResults };
        }

        // 2. Fallback to USDA Live API
        const response = await fetch(
            `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&api_key=${USDA_API_KEY}`
        );
        const usdaData = await response.json();

        return { source: 'usda_api', data: usdaData.foods || [] };
    } catch (err) {
        console.error('Error fetching food data:', err);
        return { source: 'error', data: [] };
    }
}