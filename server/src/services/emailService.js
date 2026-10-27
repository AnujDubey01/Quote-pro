const { Resend } = require('resend');

const isEmailConfigured = () => {
    return Boolean(process.env.RESEND_API_KEY);
};

let resendInstance = null;
const getResendClient = () => {
    if (!resendInstance) {
        if (!isEmailConfigured()) {
            throw new Error('RESEND_API_KEY is not configured in environment variables');
        }
        resendInstance = new Resend(process.env.RESEND_API_KEY);
    }
    return resendInstance;
};

/**
 * Send Quotation Email to Customer with PDF Attachment
 */
const sendQuotationEmail = async ({ to, customerName, quotation, company, pdfBuffer }) => {
    const resend = getResendClient();
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'QuotePro <onboarding@resend.dev>';
    const companyName = company?.name || 'QuotePro Enterprise';
    const totalFormatted = Number(quotation.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
                .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                .header { background: #05603a; padding: 28px 32px; color: #ffffff; }
                .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
                .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
                .body { padding: 32px; }
                .greeting { font-size: 15px; font-weight: 600; margin-bottom: 16px; color: #0f172a; }
                .summary-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px 22px; margin: 20px 0; }
                .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
                .summary-row:last-child { margin-bottom: 0; font-weight: 700; font-size: 15px; color: #05603a; border-top: 1px solid #bbf7d0; padding-top: 8px; margin-top: 8px; }
                .footer { padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="header">
                    <h1>${companyName}</h1>
                    <p>Official Commercial Quotation #${quotation.quotationNumber}</p>
                </div>
                <div class="body">
                    <div class="greeting">Dear ${customerName || 'Valued Client'},</div>
                    <p style="font-size: 13px; line-height: 1.6; color: #334155;">
                        Thank you for your business. We are pleased to provide you with the formal architectural proposal and quotation for your review.
                    </p>
                    
                    <div class="summary-box">
                        <div style="font-size: 12px; font-weight: 700; color: #05603a; margin-bottom: 10px; text-transform: uppercase;">
                            Proposal Summary
                        </div>
                        <div style="font-size: 13px; line-height: 1.8;">
                            <div><strong>Quotation Number:</strong> #${quotation.quotationNumber}</div>
                            <div><strong>Line Items:</strong> ${quotation.items?.length || 0} product(s)</div>
                            <div><strong>Total Amount (incl. Tax):</strong> ₹${totalFormatted}</div>
                        </div>
                    </div>

                    <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
                        📎 <strong>Attached:</strong> Complete itemized quotation PDF with high-resolution product imagery, technical specifications, and tax breakdowns.
                    </p>
                </div>
                <div class="footer">
                    Sent via ${companyName} CPQ Platform • All rights reserved
                </div>
            </div>
        </body>
        </html>
    `;

    const attachments = [];
    if (pdfBuffer) {
        attachments.push({
            filename: `Quotation-${quotation.quotationNumber}.pdf`,
            content: Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer)
        });
    }

    const result = await resend.emails.send({
        from: fromAddress,
        to: to,
        subject: `Quotation #${quotation.quotationNumber} from ${companyName}`,
        html: htmlContent,
        attachments: attachments.length > 0 ? attachments : undefined
    });

    if (result.error) {
        throw new Error(result.error.message || 'Resend API failed to send email');
    }

    return result.data;
};

/**
 * Send alert to manager when a quotation breaches approval ceilings
 */
const sendApprovalRequiredAlert = async ({ managerEmail, managerName, quotation, salesRepName, company, discountPercent }) => {
    if (!isEmailConfigured() || !managerEmail) return null;
    const resend = getResendClient();
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'QuotePro <onboarding@resend.dev>';
    const companyName = company?.name || 'QuotePro Enterprise';

    const htmlContent = `
        <div style="font-family: sans-serif; padding: 24px; color: #1e293b;">
            <div style="background: #fff7ed; border: 1px solid #fdba74; padding: 20px; border-radius: 12px; max-width: 580px;">
                <h3 style="color: #c2410c; margin-top: 0;">⚠️ Action Required: Quotation Exceeds Commercial Ceiling</h3>
                <p>Hello ${managerName || 'Manager'},</p>
                <p>Sales representative <strong>${salesRepName || 'Sales Rep'}</strong> has submitted quotation <strong>#${quotation.quotationNumber}</strong> for client <strong>${quotation.customerSnapshot?.name || 'Client'}</strong> requiring your authorization.</p>
                <ul>
                    <li><strong>Quotation #:</strong> #${quotation.quotationNumber}</li>
                    <li><strong>Total Proposal Value:</strong> ₹${Number(quotation.total || 0).toLocaleString('en-IN')}</li>
                    <li><strong>Discount Applied:</strong> ${discountPercent ? Number(discountPercent).toFixed(1) : 0}%</li>
                    <li><strong>Status:</strong> Pending Manager Approval</li>
                </ul>
                <p>Please log in to your QuotePro Manager Console to inspect itemized line margins and approve or reject this proposal.</p>
            </div>
        </div>
    `;

    try {
        const result = await resend.emails.send({
            from: fromAddress,
            to: managerEmail,
            subject: `[Urgent Approval] Quotation #${quotation.quotationNumber} requires sign-off`,
            html: htmlContent
        });
        return result.data;
    } catch (err) {
        console.warn('Failed to send manager approval alert email:', err.message);
        return null;
    }
};

/**
 * Send decision alert to sales representative when quote is approved or rejected
 */
const sendQuotationDecisionAlert = async ({ salesRepEmail, salesRepName, quotation, decision, remarks, managerName, company }) => {
    if (!isEmailConfigured() || !salesRepEmail) return null;
    const resend = getResendClient();
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'QuotePro <onboarding@resend.dev>';
    const isApproved = decision === 'approved';

    const htmlContent = `
        <div style="font-family: sans-serif; padding: 24px; color: #1e293b;">
            <div style="background: ${isApproved ? '#f0fdf4' : '#fef2f2'}; border: 1px solid ${isApproved ? '#bbf7d0' : '#fecaca'}; padding: 20px; border-radius: 12px; max-width: 580px;">
                <h3 style="color: ${isApproved ? '#05603a' : '#b91c1c'}; margin-top: 0;">
                    ${isApproved ? '✓ Quotation Approved' : '❌ Quotation Rejected'}
                </h3>
                <p>Hello ${salesRepName || 'Sales Rep'},</p>
                <p>Your quotation <strong>#${quotation.quotationNumber}</strong> for <strong>${quotation.customerSnapshot?.name || 'Client'}</strong> has been <strong>${decision.toUpperCase()}</strong> by manager ${managerName || 'Manager'}.</p>
                ${remarks ? `<p><strong>Manager Remarks:</strong> "${remarks}"</p>` : ''}
                <p>${isApproved ? 'The proposal has been unblocked and is now ready to download as a verified PDF or email directly to the client.' : 'You can create a revision directly in your QuotePro console to adjust line item discounts.'}</p>
            </div>
        </div>
    `;

    try {
        const result = await resend.emails.send({
            from: fromAddress,
            to: salesRepEmail,
            subject: `[Proposal ${isApproved ? 'Approved' : 'Rejected'}] Quotation #${quotation.quotationNumber}`,
            html: htmlContent
        });
        return result.data;
    } catch (err) {
        console.warn('Failed to send decision alert email:', err.message);
        return null;
    }
};

module.exports = {
    isEmailConfigured,
    sendQuotationEmail,
    sendApprovalRequiredAlert,
    sendQuotationDecisionAlert
};
