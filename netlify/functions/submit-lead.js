// netlify/functions/submit-lead.js
// API endpoint: /.netlify/functions/submit-lead

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // Only POST allowed
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Parse request
        const data = JSON.parse(event.body);
        const { name, phone, email, program, industry } = data;

        // Validate
        if (!name || !phone || !program) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'Missing required fields',
                    required: ['name', 'phone', 'program']
                })
            };
        }

        // Validate phone
        const phoneRegex = /^(0|\+84)[0-9]{9}$/;
        if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Số điện thoại không hợp lệ' })
            };
        }

        // Init Supabase
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );

        // Check duplicate (last 24h)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const { data: existing } = await supabase
            .from('leads')
            .select('id')
            .eq('phone', phone)
            .gte('created_at', yesterday.toISOString())
            .single();

        if (existing) {
            return {
                statusCode: 409,
                headers,
                body: JSON.stringify({ 
                    error: 'Duplicate',
                    message: 'Bạn đã đăng ký trong 24h qua!'
                })
            };
        }

        // Get tracking info
        const clientHeaders = event.headers;
        const ip = clientHeaders['x-forwarded-for'] || clientHeaders['client-ip'];
        const userAgent = clientHeaders['user-agent'];
        
        // Parse UTM from URL or body
        const { utm_source, utm_medium, utm_campaign } = data;

        // Insert lead
        const { data: lead, error } = await supabase
            .from('leads')
            .insert([{
                name,
                phone,
                email,
                program,
                industry,
                source: utm_source,
                medium: utm_medium,
                campaign: utm_campaign,
                ip_address: ip,
                user_agent: userAgent,
                status: 'new'
            }])
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Database error' })
            };
        }

        // Send confirmation email (async, don't wait)
        if (email) {
            sendEmail(lead).catch(err => console.error('Email error:', err));
        }

        // Return success
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Đăng ký thành công! Tư vấn viên sẽ liên hệ trong 30 phút.',
                lead_id: lead.id
            })
        };

    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Server error',
                message: 'Có lỗi xảy ra. Vui lòng thử lại.'
            })
        };
    }
};

// Helper: Send email
async function sendEmail(lead) {
    // Using Resend (free tier: 3000 emails/month)
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) return;

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: 'Tikme <noreply@tikme.com>',
            to: lead.email,
            subject: '✅ Đăng ký thành công - Tikme TTS',
            html: `
                <h2>Xin chào ${lead.name}!</h2>
                <p>Cảm ơn bạn đã đăng ký chương trình <strong>${getProgramName(lead.program)}</strong>.</p>
                <p><strong>Tư vấn viên sẽ gọi cho bạn trong 30 phút!</strong></p>
                <p>Hotline: <strong>090-6666-222</strong></p>
            `
        })
    });

    if (!response.ok) {
        throw new Error('Email failed');
    }
}

function getProgramName(id) {
    const names = {
        'tts-1': 'TTS 1 năm',
        'tts-3': 'TTS 3 năm',
        'tokutei': 'Tokutei Ginou'
    };
    return names[id] || id;
}
