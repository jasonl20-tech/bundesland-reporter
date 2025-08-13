import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Webhook proxy called with method:', req.method);
    
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    // Get the form data from the request
    const formData = await req.formData();
    
    console.log('Form data received, forwarding to webhook...');
    
    // Forward the request to the external webhook
    const response = await fetch('http://xlk.ai:5678/webhook/7b9f8290-9e23-474d-af86-eaa3d3777951', {
      method: 'POST',
      body: formData,
    });

    console.log('Webhook response status:', response.status);

    if (response.ok) {
      const responseText = await response.text();
      console.log('Webhook success response:', responseText);
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Data sent successfully' 
      }), {
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      });
    } else {
      console.error('Webhook failed with status:', response.status);
      throw new Error(`Webhook failed with status: ${response.status}`);
    }

  } catch (error) {
    console.error('Error in webhook proxy:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });
  }
})