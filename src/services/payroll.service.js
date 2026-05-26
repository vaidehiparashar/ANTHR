// src/services/payroll.service.js
const PDFDocument = require('pdfkit');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const fmt = (amount, currency = 'USD') => `${currency} ${parseFloat(amount).toFixed(2)}`;

const generatePayrollPDF = (payroll) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const emp = payroll.employee;
      const user = emp.user;
      const monthYear = `${MONTHS[payroll.month - 1]} ${payroll.year}`;
      const companyName = process.env.COMPANY_NAME || 'Antbox Technologies Ltd';
      const companyAddress = process.env.COMPANY_ADDRESS || '123 Business Park, Tech City';

      // ── Header ────────────────────────────────────────────────────────────
      doc.fillColor('#1a1a2e').rect(0, 0, doc.page.width, 80).fill();
      doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text(companyName, 50, 25);
      doc.fontSize(10).font('Helvetica').text(companyAddress, 50, 52);
      doc.fillColor('#4fc3f7').fontSize(14).font('Helvetica-Bold').text('PAYSLIP', doc.page.width - 120, 30);
      doc.fillColor('#b0bec5').fontSize(9).font('Helvetica').text(`For ${monthYear}`, doc.page.width - 120, 50);

      doc.moveDown(4);

      // ── Employee Info ─────────────────────────────────────────────────────
      doc.fillColor('#1a1a2e').fontSize(13).font('Helvetica-Bold').text('Employee Information', 50, 110);
      doc.moveTo(50, 127).lineTo(doc.page.width - 50, 127).strokeColor('#e0e0e0').lineWidth(1).stroke();

      const infoY = 135;
      const col1 = 50, col2 = 300;

      const drawField = (label, value, x, y) => {
        doc.fillColor('#757575').fontSize(8).font('Helvetica').text(label, x, y);
        doc.fillColor('#1a1a2e').fontSize(10).font('Helvetica-Bold').text(value || 'N/A', x, y + 13);
      };

      drawField('Employee Name', `${user.firstName} ${user.lastName}`, col1, infoY);
      drawField('Employee ID', emp.employeeId, col2, infoY);
      drawField('Department', emp.department?.name || 'N/A', col1, infoY + 40);
      drawField('Position', emp.position?.title || 'N/A', col2, infoY + 40);
      drawField('Payroll Number', payroll.payrollNumber, col1, infoY + 80);
      drawField('Payment Status', payroll.status, col2, infoY + 80);
      drawField('Pay Period', monthYear, col1, infoY + 120);
      drawField('Payment Date', payroll.paidAt ? new Date(payroll.paidAt).toLocaleDateString() : 'Pending', col2, infoY + 120);

      const tableTop = infoY + 175;

      // ── Earnings ──────────────────────────────────────────────────────────
      doc.fillColor('#1a1a2e').fontSize(13).font('Helvetica-Bold').text('Earnings', col1, tableTop);
      doc.moveTo(col1, tableTop + 17).lineTo(doc.page.width - 50, tableTop + 17).strokeColor('#e0e0e0').stroke();

      const earningsData = [
        ['Basic Salary', fmt(payroll.basicSalary, payroll.currency)],
        ['Allowances', fmt(payroll.allowances, payroll.currency)],
        ['Overtime Pay', fmt(payroll.overtime, payroll.currency)],
        ['Bonus', fmt(payroll.bonus, payroll.currency)],
      ];

      let rowY = tableTop + 25;
      earningsData.forEach(([label, value], i) => {
        if (i % 2 === 0) doc.fillColor('#f8f9fa').rect(col1, rowY - 3, doc.page.width - 100, 18).fill();
        doc.fillColor('#424242').fontSize(10).font('Helvetica').text(label, col1 + 5, rowY);
        doc.fillColor('#2e7d32').fontSize(10).font('Helvetica-Bold').text(value, col2 + 50, rowY, { align: 'right', width: 150 });
        rowY += 20;
      });

      // Gross
      doc.fillColor('#e8f5e9').rect(col1, rowY, doc.page.width - 100, 22).fill();
      doc.fillColor('#1b5e20').fontSize(11).font('Helvetica-Bold').text('Gross Salary', col1 + 5, rowY + 5);
      doc.text(fmt(payroll.grossSalary, payroll.currency), col2 + 50, rowY + 5, { align: 'right', width: 150 });

      rowY += 40;

      // ── Deductions ────────────────────────────────────────────────────────
      doc.fillColor('#1a1a2e').fontSize(13).font('Helvetica-Bold').text('Deductions', col1, rowY);
      doc.moveTo(col1, rowY + 17).lineTo(doc.page.width - 50, rowY + 17).strokeColor('#e0e0e0').stroke();

      const deductionsData = [
        ['Income Tax', fmt(payroll.taxDeduction, payroll.currency)],
        ['Provident Fund', fmt(payroll.providentFund, payroll.currency)],
        ['Health Insurance', fmt(payroll.healthInsurance, payroll.currency)],
        ['Other Deductions', fmt(payroll.otherDeductions, payroll.currency)],
      ];

      rowY += 25;
      deductionsData.forEach(([label, value], i) => {
        if (i % 2 === 0) doc.fillColor('#fff8f8').rect(col1, rowY - 3, doc.page.width - 100, 18).fill();
        doc.fillColor('#424242').fontSize(10).font('Helvetica').text(label, col1 + 5, rowY);
        doc.fillColor('#c62828').fontSize(10).font('Helvetica-Bold').text(value, col2 + 50, rowY, { align: 'right', width: 150 });
        rowY += 20;
      });

      // Total deductions
      doc.fillColor('#ffebee').rect(col1, rowY, doc.page.width - 100, 22).fill();
      doc.fillColor('#b71c1c').fontSize(11).font('Helvetica-Bold').text('Total Deductions', col1 + 5, rowY + 5);
      doc.text(fmt(payroll.totalDeductions, payroll.currency), col2 + 50, rowY + 5, { align: 'right', width: 150 });

      rowY += 35;

      // ── Net Salary ────────────────────────────────────────────────────────
      doc.fillColor('#1565c0').rect(col1, rowY, doc.page.width - 100, 35).fill();
      doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold').text('NET SALARY', col1 + 10, rowY + 10);
      doc.fontSize(14).text(fmt(payroll.netSalary, payroll.currency), col2 + 50, rowY + 10, { align: 'right', width: 150 });

      // ── Footer ────────────────────────────────────────────────────────────
      const footerY = doc.page.height - 80;
      doc.fillColor('#e0e0e0').rect(0, footerY, doc.page.width, 1).fill();
      doc.fillColor('#9e9e9e').fontSize(8).font('Helvetica')
        .text('This is a computer-generated payslip and does not require a signature.', 50, footerY + 15, { align: 'center', width: doc.page.width - 100 })
        .text(`Generated on ${new Date().toLocaleString()} | ${companyName}`, 50, footerY + 30, { align: 'center', width: doc.page.width - 100 });

      if (payroll.notes) {
        doc.fillColor('#546e7a').fontSize(9).text(`Notes: ${payroll.notes}`, 50, footerY + 45);
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generatePayrollPDF };
