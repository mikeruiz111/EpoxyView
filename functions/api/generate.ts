interface Env {
  GEMINI_API_KEY?: string;
  API_KEY?: string;
  [key: string]: any;
}

interface RequestBody {
  imageBase64: string;
  prompt: string;
  model?: string;
}

// Define Cloudflare Pages types
type PagesFunction<Env = unknown, Params extends string = any, Data extends Record<string, unknown> = Record<string, unknown>> = (
  context: EventContext<Env, Params, Data>
) => Response | Promise<Response>;

interface EventContext<Env, Params extends string, Data> {
  request: Request;
  functionPath: string;
  waitUntil: (promise: Promise<any>) => void;
  passThroughOnException: () => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  env: Env;
  params: Params;
  data: Data;
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Standard CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    // 1. Security: Validate API Key
    const apiKey = env.GEMINI_API_KEY || env.API_KEY;

    if (!apiKey) {
      const availableKeys = Object.keys(env);
      console.error("Missing API Key. Available env keys:", availableKeys);
      
      return new Response(JSON.stringify({ 
        error: "Server configuration error", 
        details: "GEMINI_API_KEY not found in environment."
      }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // 2. Parse Body
    let body: RequestBody;
    try {
      body = await request.json() as RequestBody;
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: corsHeaders });
    }

    const { imageBase64, prompt, model } = body;

    if (!imageBase64 || !prompt) {
      return new Response(JSON.stringify({ error: "Missing required fields: imageBase64, prompt" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // 3. Security: Size Limit (Approx 5MB)
    if (imageBase64.length > 7_000_000) {
      return new Response(JSON.stringify({ error: "Image payload too large (max 5MB)" }), {
        status: 413,
        headers: corsHeaders,
      });
    }

    // 4. Construct Gemini Request
    // IMPORTANT: Use gemini-2.5-flash-image for image editing tasks
    const targetModel = model || 'gemini-2.5-flash-image';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

    // Note: For image editing/captioning with Gemini, providing the Image Part FIRST
    // followed by the Text Part is often more reliable.
    const payload = {
      contents: [{
        parts: [
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: imageBase64
            }
          },
          { text: prompt }
        ]
      }]
    };

    // 5. Call Google Gemini API
    const apiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error("Upstream API Error:", JSON.stringify(data));
      const errorMessage = (data as any).error?.message || "Unknown upstream error";
      const errorCode = (data as any).error?.code || apiResponse.status;
      
      return new Response(JSON.stringify({ 
        error: "Failed to generate content from AI provider", 
        details: `${errorCode}: ${errorMessage}`
      }), {
        status: apiResponse.status,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (err: any) {
    console.error("Internal Function Error:", err);
    return new Response(JSON.stringify({ 
      error: "Internal Server Error", 
      details: err.message 
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
};