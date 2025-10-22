const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables:');
  console.error('SUPABASE_URL:', process.env.SUPABASE_URL ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Important: needs service role key for seeding
);

const TEST_DATA = {
  users: [
    { email: 'farmer@example.com', name: 'John Farmer', role: 'farmer', phone: '+254700000001' },
    { email: 'vet@example.com', name: 'Dr. Sarah Vet', role: 'vet', phone: '+254700000002' },
    { email: 'agrovet@example.com', name: 'Mike Supply', role: 'agrovet', phone: '+254700000003' },
    { email: 'admin@example.com', name: 'Admin User', role: 'admin', phone: '+254700000004' }
  ],
  animals: [
    { name: 'Bessie', species: 'Cow', breed: 'Holstein', tag_number: 'C001', sex: 'Female', dob: '2023-01-15' },
    { name: 'Daisy', species: 'Cow', breed: 'Jersey', tag_number: 'C002', sex: 'Female', dob: '2023-02-20' },
    { name: 'Billy', species: 'Goat', breed: 'Boer', tag_number: 'G001', sex: 'Male', dob: '2023-03-10' },
    { name: 'Wooley', species: 'Sheep', breed: 'Merino', tag_number: 'S001', sex: 'Female', dob: '2023-04-05' },
    { name: 'Buck', species: 'Goat', breed: 'Alpine', tag_number: 'G002', sex: 'Male', dob: '2023-05-01' }
  ],
  events: [
    { type: 'weight', value: 450, notes: 'Regular checkup' },
    { type: 'milk_yield', value: 25, notes: 'Morning milking' },
    { type: 'treatment', notes: 'Deworming done' }
  ],
  crops: [
    { crop_type: 'Maize', area_size: 2.5, planted_date: '2023-03-15', expected_harvest: '2023-08-15' },
    { crop_type: 'Beans', area_size: 1.0, planted_date: '2023-04-01', expected_harvest: '2023-07-01' }
  ],
  feeds: [
    { name: 'Dairy Meal', type: 'Concentrate', stock_quantity: 500, unit: 'kg', minimum_stock: 100 },
    { name: 'Hay', type: 'Roughage', stock_quantity: 1000, unit: 'bales', minimum_stock: 200 }
  ],
  vet_services: ['Vaccination', 'General Checkup', 'Emergency Care', 'Pregnancy Diagnosis'],
  agrovet_products: [
    { name: 'Premium Dairy Feed', category: 'Feed', price: 2500, quantity: 1000, unit: 'kg' },
    { name: 'Dewormer', category: 'Medicine', price: 500, quantity: 50, unit: 'doses' }
  ]
};

async function seed() {
  try {
    console.log('Starting seed process...');

    // Clean up existing data
    console.log('\nCleaning up existing data...');
    await supabase.from('animal_events').delete();
    await supabase.from('health_records').delete();
    await supabase.from('animals').delete();
    await supabase.from('crops').delete();
    await supabase.from('feeds').delete();
    await supabase.from('vet_profiles').delete();
    await supabase.from('agrovet_profiles').delete();
    await supabase.from('users').delete().neq('id', 'dummy'); // Delete all users
    
    // 1. Create or update users
    console.log('\nCreating or updating users...');
    const { data: existingUsers } = await supabase
      .from('users')
      .select('email');

    const existingEmails = new Set(existingUsers?.map(u => u.email) || []);
    
    // Split users into new and existing
    const newUsers = [];
    const updateUsers = [];
    
    TEST_DATA.users.forEach(user => {
      if (existingEmails.has(user.email)) {
        updateUsers.push(user);
      } else {
        newUsers.push(user);
      }
    });

    // Insert new users
    let users = [];
    if (newUsers.length > 0) {
      const { data: newData, error: insertError } = await supabase
        .from('users')
        .insert(newUsers)
        .select();
      if (insertError) throw insertError;
      users = users.concat(newData);
    }

    // Update existing users
    if (updateUsers.length > 0) {
      for (const user of updateUsers) {
        const { data: updatedData, error: updateError } = await supabase
          .from('users')
          .update({ name: user.name, role: user.role, phone: user.phone })
          .eq('email', user.email)
          .select();
        if (updateError) throw updateError;
        users = users.concat(updatedData);
      }
    }

    console.log(`Processed ${users.length} users`);

    const farmer = users.find(u => u.role === 'farmer');
    const vet = users.find(u => u.role === 'vet');
    const agrovet = users.find(u => u.role === 'agrovet');

    // Create animals
    console.log('\nCreating animals...');
    const animalsWithFarmer = TEST_DATA.animals.map(a => ({ ...a, farmer_id: farmer.id }));
    const { data: animals, error: animalError } = await supabase
      .from('animals')
      .insert(animalsWithFarmer)
      .select();
    
    if (animalError) throw animalError;
    console.log(`Created ${animals.length} animals`);

    // 4. Add some events for the first animal
    console.log('\nAdding animal events...');
    const eventsWithAnimal = TEST_DATA.events.map(e => ({
      ...e,
      animal_id: animals[0].id,
      created_by: farmer.id
    }));
    await supabase.from('animal_events').insert(eventsWithAnimal);

    // 5. Create vet profile
    console.log('\nCreating vet profile...');
    const { data: vetProfile, error: vetError } = await supabase
      .from('vet_profiles')
      .insert([{
        user_id: vet.id,
        qualifications: ['DVM', 'Animal Science'],
        services: TEST_DATA.vet_services,
        working_hours: {
          mon_fri: '8:00-17:00',
          sat: '9:00-13:00'
        },
        location: `POINT(36.8219 -1.2921)`,
        address: 'Nairobi, Kenya'
      }])
      .select();
    
    if (vetError) throw vetError;
    console.log('Created vet profile');

    // 6. Create agrovet profile and inventory
    console.log('\nCreating agrovet profile and products...');
    const { data: agrovetProfile, error: agrovetError } = await supabase
      .from('agrovet_profiles')
      .insert([{
        user_id: agrovet.id,
        business_name: 'Farm Supplies Ltd',
        business_type: 'General Supplier',
        location: `POINT(36.8219 -1.2921)`,
        address: 'Nairobi, Kenya'
      }])
      .select();
    
    if (agrovetError) throw agrovetError;

    const productsWithAgrovet = TEST_DATA.agrovet_products.map(p => ({
      ...p,
      agrovet_id: agrovetProfile[0].id
    }));
    await supabase.from('agrovet_inventory').insert(productsWithAgrovet);

    // 7. Create crops
    console.log('\nCreating crops...');
    const cropsWithFarmer = TEST_DATA.crops.map(c => ({ ...c, farmer_id: farmer.id }));
    await supabase.from('crops').insert(cropsWithFarmer);

    // 8. Create feeds
    console.log('\nCreating feeds...');
    const feedsWithFarmer = TEST_DATA.feeds.map(f => ({ ...f, farmer_id: farmer.id }));
    await supabase.from('feeds').insert(feedsWithFarmer);

    console.log('\nSeed completed successfully!');
    console.log('\nTest accounts:');
    console.log('Farmer:', TEST_DATA.users[0].email);
    console.log('Vet:', TEST_DATA.users[1].email);
    console.log('Agrovet:', TEST_DATA.users[2].email);
    console.log('Admin:', TEST_DATA.users[3].email);

  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
