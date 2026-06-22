// api/track.js - Vercel Serverless Function

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { visitCount, referrer, sourceParam, userParam, userAgent } = req.body;

    // 1. Capture IP securely from Vercel headers
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    // 2. Format Timestamp for Asia/Karachi
    const karachiTime = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Karachi",
      dateStyle: "medium",
      timeStyle: "medium"
    });

    // 3. Identify Referrer Source (e.g., Instagram, LinkedIn)
    let referrerSource = 'Other/Direct';
    if (referrer.includes('instagram.com')) referrerSource = 'Instagram';
    else if (referrer.includes('linkedin.com')) referrerSource = 'LinkedIn';
    else if (referrer.includes('facebook.com')) referrerSource = 'Facebook';
    else if (referrer.includes('t.co') || referrer.includes('twitter.com')) referrerSource = 'Twitter/X';

    // 4. Send to Supabase
    // Note: These env variables must be set in your Vercel Dashboard
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Supabase environment variables are missing');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/portfolio_visitors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        ip_address: ip,
        user_agent: userAgent,
        referrer_url: referrer,
        referrer_source: referrerSource,
        utm_source: sourceParam,
        utm_user: userParam,
        visit_count: visitCount,
        timestamp_karachi: karachiTime
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Supabase error:', errorData);
      return res.status(502).json({ error: 'Failed to log to database' });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Tracking Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
