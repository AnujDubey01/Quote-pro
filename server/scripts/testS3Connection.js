require('dotenv').config();
const { verifyS3Connection, uploadToS3 } = require('../src/services/s3Service');

async function main() {
    console.log('===========================================================');
    console.log('               AWS S3 CONNECTION & UPLOAD TEST            ');
    console.log('===========================================================\n');

    console.log('Environment configuration detected:');
    console.log('  AWS_S3_BUCKET:       ', process.env.AWS_S3_BUCKET || '(not set)');
    console.log('  AWS_REGION:          ', process.env.AWS_REGION || '(not set)');
    console.log('  AWS_ACCESS_KEY_ID:   ', process.env.AWS_ACCESS_KEY_ID ? `${process.env.AWS_ACCESS_KEY_ID.slice(0, 6)}...` : '(not set)');
    console.log('  AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '****** (configured)' : '(not set)\n');

    const result = await verifyS3Connection();

    if (!result.connected) {
        console.error('❌ Connection Failed:', result.error || result.message);
        console.log('\nPlease make sure your 4 values are saved in server/.env:');
        console.log('  AWS_ACCESS_KEY_ID=...');
        console.log('  AWS_SECRET_ACCESS_KEY=...');
        console.log('  AWS_REGION=...');
        console.log('  AWS_S3_BUCKET=...\n');
        process.exit(1);
    }

    console.log('✓ Successfully connected to AWS S3 bucket:', result.bucket);

    // Test a sample upload
    console.log('\nTesting live object upload:');
    const testKey = `test/ping_${Date.now()}.txt`;
    const testBuffer = Buffer.from('QuotePro AWS S3 Integration verified successfully!');
    
    try {
        const fileUrl = await uploadToS3(testBuffer, testKey, 'text/plain');
        console.log('✓ File uploaded successfully to S3!');
        console.log('  File URL:', fileUrl);
        console.log('\n===========================================================');
        console.log('               AWS S3 READY FOR PRODUCTION ✓               ');
        console.log('===========================================================');
    } catch (err) {
        console.error('❌ Upload failed:', err.message);
        process.exit(1);
    }
}

main();
