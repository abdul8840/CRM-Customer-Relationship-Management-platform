const PDFDocument = require('pdfkit');
const cloudinary = require('./cloudinary.service');
const logger = require('../config/logger');

const streamToBuffer = (stream) => new Promise((resolve, reject) => {
  const chunks = [];
  stream.on('data', (c) => chunks.push(c));
  stream.on('end', () => resolve(Buffer.concat(chunks)));
  stream.on('error', reject);
});

exports.generateInvoicePdf = async ({ invoice, user, plan }) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const bufferPromise = streamToBuffer(doc);

  // Header
  doc.fontSize(22).fillColor('#1d4ed8').text('INVOICE', { align: 'right' });
  doc.fontSize(10).fillColor('#666').text(`#${invoice.invoice_number}`, { align: 'right' });
  doc.moveDown(2);

  // Company
  doc.fontSize(14).fillColor('#111').text('CRM Platform', 50, doc.y);
  doc.fontSize(10).fillColor('#666').text('hello@crm.local');
  doc.moveDown();

  // Bill to
  doc.fontSize(11).fillColor('#111').text('Bill To:');
  doc.fontSize(10).fillColor('#444')
    .text(`${user.first_name} ${user.last_name || ''}`)
    .text(user.email);
  doc.moveDown(2);

  // Dates
  doc.fontSize(10).fillColor('#666')
    .text(`Invoice date: ${new Date(invoice.created_at || Date.now()).toLocaleDateString()}`, { align: 'right' })
    .text(`Status: ${invoice.status.toUpperCase()}`, { align: 'right' });
  doc.moveDown(2);

  // Table header
  const tableTop = doc.y;
  doc.fontSize(11).fillColor('#111').text('Description', 50, tableTop)
    .text('Amount', 450, tableTop, { align: 'right' });
  doc.moveTo(50, tableTop + 18).lineTo(545, tableTop + 18).strokeColor('#ddd').stroke();

  // Line
  doc.fontSize(10).fillColor('#444')
    .text(`${plan.name} subscription (${plan.interval}ly)`, 50, tableTop + 28)
    .text(`${invoice.currency} ${Number(invoice.amount).toFixed(2)}`, 450, tableTop + 28, { align: 'right' });

  // Totals
  const totalsY = tableTop + 80;
  doc.fontSize(10).fillColor('#666')
    .text('Subtotal:', 380, totalsY).text(`${invoice.currency} ${Number(invoice.amount).toFixed(2)}`, 450, totalsY, { align: 'right' })
    .text('Tax:', 380, totalsY + 15).text(`${invoice.currency} ${Number(invoice.tax).toFixed(2)}`, 450, totalsY + 15, { align: 'right' });
  doc.fontSize(12).fillColor('#111').font('Helvetica-Bold')
    .text('Total:', 380, totalsY + 35).text(`${invoice.currency} ${Number(invoice.total).toFixed(2)}`, 450, totalsY + 35, { align: 'right' });

  // Footer
  doc.font('Helvetica').fontSize(9).fillColor('#999')
    .text('Thank you for your business.', 50, 750, { align: 'center', width: 495 });

  doc.end();
  const buffer = await bufferPromise;

  // Upload to Cloudinary
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: 'crm/invoices', resource_type: 'raw', public_id: `invoice-${invoice.invoice_number}`, format: 'pdf' },
      (err, result) => err ? reject(err) : resolve(result.secure_url),
    ).end(buffer);
  });
};