const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const body = JSON.parse(event.body);
    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

    if (!REPLICATE_API_TOKEN) {
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: 'REPLICATE_API_TOKEN is missing in Netlify Environment Variables.' }) 
      };
    }

    // Agar check_url aaya hai toh status poll karein
    if (body.action === 'check') {
      const pollResponse = await fetch(body.poll_url, {
        headers: { "Authorization": `Token ${REPLICATE_API_TOKEN}` }
      });
      const pollData = await pollResponse.json();
      return { statusCode: 200, body: JSON.stringify(pollData) };
    }

    // First time generation request
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "9222a21c49466720a76e1c220327edb669c267f235d68060305ba3d47e6d2348",
        input: {
          qr_code_content: body.qrData,
          image: body.userPhotoBase64,
          prompt: `${body.prompt}, 3D anime cartoon style, high quality portrait, scannable pattern`,
          negative_prompt: "ugly, blurry, distorted, low quality, bad architecture, messy",
          controlnet_conditioning_scale: 1.15,
          guidance_scale: 7.5
        }
      })
    });

    const data = await response.json();

    if (data.error) {
      return { statusCode: 400, body: JSON.stringify({ error: data.error }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ poll_url: data.urls.get })
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
