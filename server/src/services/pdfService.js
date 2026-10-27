const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

const generateQuotationPDF = async (quotation, company) => {
    try {
        const templatePath = path.join(__dirname, 'templates', 'quotation.ejs');
        
        // Ensure template exists
        if (!fs.existsSync(templatePath)) {
            throw new Error('Template file not found');
        }

        // Clone quotation data for rendering
        const quotationData = JSON.parse(JSON.stringify(quotation));
        
        // Convert any local asset images to base64 Data URIs for Puppeteer
        if (quotationData.items && Array.isArray(quotationData.items)) {
            const rootAssetsDir = path.join(__dirname, '../../../assets');
            for (const item of quotationData.items) {
                if (item.image && item.image.startsWith('/assets/')) {
                    const relativePath = item.image.replace(/^\/assets\//, '');
                    const fullPath = path.join(rootAssetsDir, relativePath);
                    if (fs.existsSync(fullPath)) {
                        const ext = path.extname(fullPath).slice(1) || 'png';
                        const base64Data = fs.readFileSync(fullPath).toString('base64');
                        item.image = `data:image/${ext};base64,${base64Data}`;
                    }
                }
            }
        }

        // Sanitize company data and ensure bank details are never present in PDF
        const companyData = company ? JSON.parse(JSON.stringify(company)) : {};
        if (companyData.settings && companyData.settings.bankDetails) {
            delete companyData.settings.bankDetails;
        }

        // If company logo is a local asset path, convert to base64 Data URI
        if (companyData.logo && (companyData.logo.startsWith('/assets/') || companyData.logo.startsWith('/uploads/'))) {
            const rootAssetsDir = path.join(__dirname, '../../../assets');
            const relativePath = companyData.logo.replace(/^\/(assets|uploads)\//, '');
            const fullPath = path.join(rootAssetsDir, relativePath);
            if (fs.existsSync(fullPath)) {
                const ext = path.extname(fullPath).slice(1) || 'png';
                const base64Data = fs.readFileSync(fullPath).toString('base64');
                companyData.logo = `data:image/${ext};base64,${base64Data}`;
            }
        }

        // Render HTML using EJS
        const html = await ejs.renderFile(templatePath, { quotation: quotationData, company: companyData });

        // Launch Puppeteer
        const browser = await puppeteer.launch({
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        const page = await browser.newPage();

        // Set HTML content
        await page.setContent(html, { waitUntil: 'networkidle0' });

        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '40px',
                bottom: '40px',
                left: '40px',
                right: '40px',
            }
        });

        await browser.close();

        return pdfBuffer;
    } catch (error) {
        throw new Error(`PDF Generation failed: ${error.message}`);
    }
};

module.exports = { generateQuotationPDF };
