interface Env {
  GEMINI_API_KEY?: string;
  API_KEY?: string;
  INTERNAL_API_KEY?: string; // Added for our own API authentication
  [key: string]: any;
}

interface RequestBody {
  imageBase64: string;
  prompt: string;
  model?: string;
  mimeType?: string;
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

// 1. Define the allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5173', // Vite default dev port
  'http://localhost:3000', // Common dev port
  'https://yourapp.com',    // Your production frontend
];

// 2. Helper function to generate appropriate CORS headers
const getCorsHeaders = (requestOrigin: string | null) => {
  const headers: { [key: string]: string } = {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key', // Allow custom header
  };
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    headers['Access-Control-Allow-Origin'] = requestOrigin;
  } else {
    headers['Access-Control-Allow-Origin'] = allowedOrigins[0];
  }
  return headers;
};


export const onRequestOptions: PagesFunction = async (context) => {
    const requestOrigin = context.request.headers.get('Origin');
    return new Response(null, {
        headers: getCorsHeaders(requestOrigin),
    });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const requestOrigin = request.headers.get('Origin');

  if (!requestOrigin || !allowedOrigins.includes(requestOrigin)) {
    return new Response(JSON.stringify({ error: 'Forbidden: Invalid origin' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  const corsHeaders = {
    ...getCorsHeaders(requestOrigin),
    'Content-Type': 'application/json',
  };

  try {
    // New: Authenticate our own API endpoint
    const internalApiKey = env.INTERNAL_API_KEY;
    if (internalApiKey) {
        const clientApiKey = request.headers.get('X-API-Key');
        if (clientApiKey !== internalApiKey) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: corsHeaders,
            });
        }
    } else {
        // This is a security risk, but we are allowing it for now.
        console.warn("INTERNAL_API_KEY is not set. The /api/generate endpoint is not protected.");
    }

    const geminiApiKey = env.GEMINI_API_KEY || env.API_KEY;

    if (!geminiApiKey) {
      console.error("Missing GEMINI_API_KEY.");
      return new Response(JSON.stringify({ error: "Server configuration error: GEMINI_API_KEY not found" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    let body: RequestBody;
    try {
      body = await request.json() as RequestBody;
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: corsHeaders });
    }

    const { imageBase64, prompt, model, mimeType } = body;

    if (!imageBase64 || !prompt) {
      return new Response(JSON.stringify({ error: "Missing required fields: imageBase64, prompt" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (imageBase64.length > 7_000_000) {
      return new Response(JSON.stringify({ error: "Image payload too large (max 5MB)" }), {
        status: 413,
        headers: corsHeaders,
      });
    }

    const targetModel = model || 'gemini-2.5-flash-image';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${geminiApiKey}`;

    const payload = {
      contents: [{
        parts: [
          { inlineData: { mimeType: mimeType || "image/jpeg", data: imageBase64 } },
          { text: prompt }
        ]
      }]
    };

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
      
      return new Response(JSON.stringify({ error: `Failed to generate content: ${errorCode} ${errorMessage}` }), {
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
    return new Response(JSON.stringify({ error: "Internal Server Error", details: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
};