require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const Quotation = require('../src/models/Quotation');
const Company = require('../src/models/Company');
const Customer = require('../src/models/Customer');
const User = require('../src/models/User');
const Role = require('../src/models/Role');
const { generateQuotationPDF } = require('../src/services/pdfService');
const { sendQuotationEmail } = require('../src/services/emailService');

async function testFullQuotationEmail() {
    console.log('=== Testing Full Quotation PDF Email Dispatch via Resend ===');
    
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ Connected to MongoDB Atlas');

        // Find a quotation
        const quotation = await Quotation.findOne().populate('createdBy', 'name email');
        if (!quotation) {
            console.error('❌ No quotation found in database to test with');
            process.exit(1);
        }

        const company = await Company.findById(quotation.companyId);
        console.log(`✓ Loaded Quotation #${quotation.quotationNumber} for company "${company?.name || 'Company'}"`);
        console.log(`✓ Customer: ${quotation.customerSnapshot?.name || 'Client'} (${quotation.customerSnapshot?.email || 'No email'})`);

        console.log('⏳ Compiling high-resolution PDF buffer via Puppeteer...');
        const pdfBuffer = await generateQuotationPDF(quotation, company);
        console.log(`✓ PDF Buffer generated successfully (${pdfBuffer.length} bytes)`);

        console.log('⏳ Sending quotation email with PDF attachment to delivered@resend.dev...');
        const testRecipient = process.argv[2] || 'delivered@resend.dev';
        const result = await sendQuotationEmail({
            to: testRecipient,
            customerName: quotation.customerSnapshot?.name || 'Valued Client',
            quotation,
            company,
            pdfBuffer
        });

        console.log('====================================================');
        console.log('🎉 SUCCESS! Real Quotation PDF Email Dispatched via Resend');
        console.log('Message ID:', result.id);
        console.log('Sent To:', testRecipient);
        console.log('Attachment:', `Quotation-${quotation.quotationNumber}.pdf (${pdfBuffer.length} bytes)`);
        console.log('====================================================');

        process.exit(0);
    } catch (err) {
        console.error('❌ Test failed with error:', err.message);
        process.exit(1);
    }
}

testFullQuotationEmail();
