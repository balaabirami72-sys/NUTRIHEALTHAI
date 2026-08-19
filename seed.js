import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient('https://qzjneielobodnmitjpcr.supabase.co', 'sb_publishable_lg__tRstdbyg3dNDrK33Lg_GrsbTTM5');

async function uploadFoods() {
    const rawData = fs.readFileSync('ifct_data.json', 'utf8');
    const items = JSON.parse(rawData);

    // Format items to match database schema
    const formattedData = items.map(item => ({
        source_type: 'IFCT',
        source_id: String(item.food_code),
        name: item.food_name,
        category: item.group_name || 'General',
        nutrients: {
            calories_kcal: item.energy_kcal || 0,
            protein_g: item.protein_g || 0,
            carbs_g: item.carbohydrates_g || 0,
            fat_g: item.fat_g || 0,
            fiber_g: item.fiber_g || 0
        }
    }));

    // Batch insert into Supabase
    const { data, error } = await supabase.from('foods').insert(formattedData);
    if (error) console.error('Error inserting data:', error);
    else console.log(`Successfully inserted ${data.length} items`);
}

uploadFoods();