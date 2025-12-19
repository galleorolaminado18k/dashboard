const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://oygaxvtidrqqebnunvge.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95Z2F4dnRpZHJxcWVibnVudmdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMxNzMyMTcsImV4cCI6MjA0ODc0OTIxN30.8XhW1BYXBwFLKqmBMUa-wy7k6lT85UpD0PYXRPj1v88'
);

(async () => {
  const { data, error } = await supabase
    .from('crm_conversations')
    .select('id, phone, contact_name, updated_at')
    .order('updated_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('\n=== ULTIMAS 10 CONVERSACIONES ===');
    data.forEach(c => {
      console.log('ID:', c.id, '| Phone:', c.phone, '| Name:', c.contact_name, '| Updated:', c.updated_at);
    });
  }
})();
