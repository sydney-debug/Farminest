require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function test() {
  console.log('Testing Supabase connection...');
  
  // Try to create a test farmer
  const { data, error } = await supabase.from('farmers').insert([
    { name: 'Test Farm', email: 'test@example.com' }
  ]).select();
  
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  console.log('Success! Created farmer:', data[0]);
}

test().catch(console.error);