require('dotenv').config();
const { Resend } = require('resend');

async function testResend() {
    console.log('--- Verifying Resend API Key & Connection ---');
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.error('❌ RESEND_API_KEY not found in server/.env');
        process.exit(1);
    }

    console.log(`✓ RESEND_API_KEY detected: ${apiKey.slice(0, 7)}...${apiKey.slice(-4)}`);
    const resend = new Resend(apiKey);

    try {
        // Send a test email using Resend default testing sender & mock delivery recipient
        const response = await resend.emails.send({
            from: 'QuotePro <onboarding@resend.dev>',
            to: 'delivered@resend.dev',
            subject: 'QuotePro CPQ - Resend Integration Verification',
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #1c2237;">
                    <h2 style="color: #05603a;">QuotePro Enterprise CPQ</h2>
                    <p>✓ Resend API Key verified successfully.</p>
                    <p>Ready for transactional proposal dispatch and manager approval alerts.</p>
                </div>
            `
        });

        if (response.error) {
            console.error('❌ Resend API returned error:', response.error);
            process.exit(1);
        }

        console.log('✓ Success! Resend API returned Message ID:', response.data.id);
        console.log('--- RESEND VERIFICATION PASSED ---');
    } catch (err) {
        console.error('❌ Resend verification failed with exception:', err.message);
        process.exit(1);
    }
}

testResend();
