import PDFDocument from 'pdfkit';

/**
 * Generates a PDF receipt for a fee payment as a Buffer.
 */
export function generateFeeReceiptPDF({ student, receipt, payment, school }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on('error', reject);

      // --- 1. Header (School Info) ---
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text(school?.name || 'Daily Day Academy', { align: 'center' });

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(school?.address || '', { align: 'center' })
        .text(`Ph: ${school?.phone || ''} | Email: ${school?.email || ''}`, { align: 'center' });

      if (school?.affiliationNumber) {
        doc
          .text(`Affiliation No: ${school.affiliationNumber}`, { align: 'center' });
      }

      doc.moveDown();
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('FEE RECEIPT', { align: 'center', underline: true });
      doc.moveDown();

      // --- 2. Receipt Details ---
      const receiptNo = payment?.receiptNumber || receipt?.receiptNumber || 'N/A';
      const paymentDate = new Date(payment?.paymentDate || receipt?.receiptDate || Date.now()).toLocaleDateString('en-IN');
      
      const leftColX = 50;
      const rightColX = 350;

      doc.fontSize(10).font('Helvetica-Bold').text(`Receipt No:`, leftColX, doc.y, { continued: true }).font('Helvetica').text(` ${receiptNo}`);
      doc.font('Helvetica-Bold').text(`Date:`, rightColX, doc.y - 12, { continued: true }).font('Helvetica').text(` ${paymentDate}`);
      
      doc.moveDown();

      // --- 3. Student Details ---
      doc.font('Helvetica-Bold').text(`Student Name:`, leftColX, doc.y, { continued: true }).font('Helvetica').text(` ${student?.name || student?.firstName + ' ' + (student?.lastName || '') || 'N/A'}`);
      doc.font('Helvetica-Bold').text(`Student ID:`, rightColX, doc.y - 12, { continued: true }).font('Helvetica').text(` ${student?.studentId || 'N/A'}`);
      
      doc.font('Helvetica-Bold').text(`Class & Section:`, leftColX, doc.y, { continued: true }).font('Helvetica').text(` ${student?.className || student?.class?.name || 'N/A'} ${student?.section || student?.class?.section ? `(${student?.section || student?.class?.section})` : ''}`);
      doc.font('Helvetica-Bold').text(`Parent/Guardian:`, rightColX, doc.y - 12, { continued: true }).font('Helvetica').text(` ${student?.parentName || (student?.parent ? student.parent.firstName + ' ' + (student.parent.lastName || '') : 'N/A')}`);

      doc.moveDown(2);

      // --- 4. Payment Details Table ---
      const startY = doc.y;
      
      // Table Header
      doc.font('Helvetica-Bold');
      doc.text('Fee Head', 50, startY);
      doc.text('Payment Method', 200, startY);
      doc.text('Transaction ID', 350, startY);
      doc.text('Amount Paid', 450, startY, { align: 'right' });
      
      doc.moveTo(50, startY + 15).lineTo(550, startY + 15).stroke();
      
      // Table Row
      const rowY = startY + 25;
      doc.font('Helvetica');
      doc.text(payment?.feeType || 'Tuition Fee', 50, rowY);
      doc.text(payment?.paymentMethod || 'CASH', 200, rowY);
      doc.text(payment?.transactionId || 'N/A', 350, rowY);
      
      const amountFormatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(payment?.amount || 0);
      doc.font('Helvetica-Bold').text(amountFormatted, 450, rowY, { align: 'right' });

      doc.moveTo(50, rowY + 15).lineTo(550, rowY + 15).stroke();
      
      doc.moveDown(3);

      // --- 5. Payment Summary ---
      const summaryX = 350;
      doc.font('Helvetica-Bold').text('Previous Due:', summaryX, doc.y, { continued: true }).font('Helvetica').text(` ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(payment?.previousDue || 0)}`, { align: 'right' });
      doc.font('Helvetica-Bold').text('Amount Paid:', summaryX, doc.y, { continued: true }).font('Helvetica').text(` ${amountFormatted}`, { align: 'right' });
      doc.font('Helvetica-Bold').text('Remaining Due:', summaryX, doc.y, { continued: true }).font('Helvetica').text(` ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(payment?.remainingDue || 0)}`, { align: 'right' });

      doc.moveDown(4);

      // --- 6. Signatures ---
      const sigY = doc.y;
      doc.font('Helvetica-Bold').text('Authorized Signatory', 400, sigY, { align: 'center' });
      doc.moveTo(400, sigY - 5).lineTo(530, sigY - 5).stroke();

      // --- 7. Footer ---
      doc.fontSize(8).font('Helvetica-Oblique').text(
        'This is a computer-generated school fee receipt. No physical stamp required if verified with transaction ID.',
        50,
        700,
        { align: 'center', width: 500 }
      );

      // Finalize PDF file
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
