import { NextResponse } from 'next/server';

/**
 * Proxy POST /api/simulate -> backend simulator
 * - Uses process.env.SIMULATOR_URL or defaults to http://127.0.0.1:5000/simulate
 * - Forwards JSON body as-is and returns backend response (attempts to parse JSON)
 */

export async function POST(req) {
  const backendUrl = process.env.SIMULATOR_URL || 'https://quantsimback.onrender.com/api/simulate';

  try {
    // Read the incoming JSON body
    const body = await req.json();

    // Forward to backend simulator
    const backendRes = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await backendRes.text();

    // Try to return parsed JSON if possible, otherwise raw text
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data, { status: backendRes.status });
    } catch (e) {
      return new NextResponse(text, { status: backendRes.status });
    }
  } catch (err) {
    console.error('Proxy error:', err);
    return NextResponse.json(
      { error: 'Failed to proxy to simulator backend', details: String(err) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, msg: 'Simulator proxy alive' });
}