import { supabase } from '../integrations/supabase/client';

const USDA_API_KEY = import.meta.env.VITE_USDA_API_KEY;

export async function searchFood(query: string): Promise<{ source: string; data: any[] }> {
  try {
    if (!query || query.trim() === '') {
      return { source: 'empty', data: [] };
    }

    // Bypass auto-generated table typing using (supabase as any)
    const { data: localResults, error } = await (supabase as any)
      .from('foods')
      .select('*')
      .textSearch('name', query, { config: 'english' });

    if (error) {
      console.error('Supabase search error:', error);
    }

    if (localResults && localResults.length > 0) {
      return { source: 'database', data: localResults };
    }

    // Fallback to USDA Live API
    if (!USDA_API_KEY) {
      console.warn('VITE_USDA_API_KEY is missing. Returning empty results.');
      return { source: 'usda_api_missing_key', data: [] };
    }

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