import { useState } from 'react';
import { searchFood } from '../controllers/foodController.ts'; // Explicitly specify .ts extension

export function FoodSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);

    const response = await searchFood(query);
    setResults(response.data || []);

    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search food..."
          style={{ flex: 1, padding: '8px' }}
        />
        <button onClick={handleSearch} disabled={loading} style={{ padding: '8px 16px' }}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      <div>
        {results.map((item: any, idx: number) => (
          <div key={item.id || idx} style={{ marginBottom: '8px' }}>
            <strong>{item.name || item.description}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}