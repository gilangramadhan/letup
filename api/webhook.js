// api/webhook.js
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse the webhook payload
    const payload = req.body;
    
    // Extract relevant data from the webhook payload
    const event = payload.event;
    const data = payload.data;
    const buyerName = data?.destination_address?.name || "Seseorang";
    const productName = data?.orderlines?.[0]?.product_name || "produk ini";
    
    // Determine notification type based on the event
    let notificationType = 'order';
    
    if (event === 'order.updated' && data?.payment_status === 'paid') {
      notificationType = 'payment';
    }
    
    // Insert notification into Supabase
    const { error } = await supabase
      .from('notifications')
      .insert({
        buyer_name: buyerName,
        product_name: productName,
        notification_type: notificationType,
        displayed: false
      });
      
    if (error) throw error;
    
    // Return success response
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
}
