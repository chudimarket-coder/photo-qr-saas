const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { prompt, qrData, userPhotoBase64 } = JSON.parse(event.body);
    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

    if (!REPLICATE_API_TOKEN) {
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: 'Netlify Dashboard me REPLICATE_API_TOKEN set nahi hai.' }) 
      };
    }

    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "9222a21c49466720a76e1c220327edb669c267f235d68060305ba3d47e6d2348",
        input: {
          qr_code_content: qrData,
          image: userPhotoBase64,
          prompt: `${prompt}, 3D anime cartoon style, high quality portrait, scannable pattern`,
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
