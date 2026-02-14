interface Env {
  GEMINI_API_KEY: string;
}

interface RequestBody {
  imageBase64: string;
  prompt: string;
  model?: string;
}

// Define missing Cloudflare Pages types
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

  // Standard CORS headers for the response
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    // 1. Security: Validate that the API Key exists in the environment
    if (!env.GEMINI_API_KEY) {
      console.error("Missing GEMINI_API_KEY environment variable");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // 2. Parse and Validate Body
    let body: RequestBody;
    try {
      body = await request.json() as RequestBody;
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: corsHeaders });
    }

    const { imageBase64, prompt, model } = body;

    if (!imageBase64 || !prompt) {
      return new Response(JSON.stringify({ error: "Missing 'imageBase64' or 'prompt' fields" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // 3. Security: Size Limit Validation (Approx 5MB limit)
    // Base64 is ~1.33x larger than binary. 5MB binary ~= 6.6MB Base64.
    // We set a safe upper bound of 7MB for the string length.
    if (imageBase64.length > 7_000_000) {
      return new Response(JSON.stringify({ error: "Image payload too large (max 5MB)" }), {
        status: 413,
        headers: corsHeaders,
      });
    }

    // 4. Construct Gemini API Request
    // We default to gemini-2.5-flash-image as per guidelines (gemini-1.5-pro is prohibited).
    const targetModel = model || 'gemini-2.5-flash-image';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${env.GEMINI_API_KEY}`;

    const payload = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: imageBase64
            }
          }
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
      console.error("Upstream API Error:", data);
      return new Response(JSON.stringify({ error: "Failed to generate content", details: data }), {
        status: apiResponse.status,
        headers: corsHeaders,
      });
    }

    // 6. Return Clean Response
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (err: any) {
    console.error("Internal Function Error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error", details: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
};