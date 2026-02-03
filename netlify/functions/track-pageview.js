// netlify/functions/track-pageview.js
// API endpoint: /.netlify/functions/track-pageview

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const data = JSON.parse(event.body);
        const { page_url, session_id, utm_source, utm_medium, utm_campaign, referrer } = data;

        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );

        const clientHeaders = event.headers;
        const ip = clientHeaders['x-forwarded-for'] || clientHeaders['client-ip'];
        const userAgent = clientHeaders['user-agent'];

        const { error } = await supabase
            .from('page_views')
            .insert([{
                page_url,
                session_id,
                utm_source,
                utm_medium,
                utm_campaign,
                referrer,
                ip_address: ip,
                user_agent: userAgent
            }]);

        if (error) {
            console.error('Tracking error:', error);
            // Don't fail - tracking is optional
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true })
        };

    } catch (error) {
        console.error('Function error:', error);
        // Don't fail the request for tracking errors
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: false })
        };
    }
};
