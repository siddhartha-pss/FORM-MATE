// client/src/utils/generatePDF.js
// ─────────────────────────────────────────────────────────────
// Generates a professional bank-style PDF for a filled form.
//
// Uses jsPDF to draw every element programmatically:
//   - Bank header with border
//   - Form title
//   - Customer info section (auto-filled fields)
//   - Manual fields section
//   - Signature box
//   - Footer with timestamp and submission reference
//
// @param formData {
//   formName    : String
//   fields      : Array of { label, value, autoFilled, type }
//   userName    : String
//   accountNumber: String
// }
//
// @returns void — triggers browser download automatically
// ─────────────────────────────────────────────────────────────

import { jsPDF } from 'jspdf';

// ── Constants — all measurements in mm (A4 page) ──
const PAGE_W    = 210;    // A4 width
const PAGE_H    = 297;    // A4 height
const MARGIN    = 18;     // left and right margin
const CONTENT_W = PAGE_W - MARGIN * 2;   // usable width = 174mm

// Colours (RGB)
const COLORS = {
  darkBlue:   [26,  60,  94],    // #1a3c5e — main brand colour
  midBlue:    [74, 106, 138],    // #4a6a8a — secondary text
  lightBlue:  [214, 234, 248],   // #d6eaf8 — section header background
  lineGray:   [208, 224, 237],   // #d0e0ed — divider lines
  black:      [30,  30,  30],    // near-black for body text
  autoFillBg: [234, 242, 251],   // #eaf2fb — auto-filled cell background
  white:      [255, 255, 255],
};

// ── Helper: set fill colour ──
const setFill = (doc, rgb) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);

// ── Helper: set draw colour ──
const setDraw = (doc, rgb) => doc.setDrawColor(rgb[0], rgb[1], rgb[2]);

// ── Helper: set text colour ──
const setTextColor = (doc, rgb) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);

// ── Helper: draw a horizontal rule ──
const drawHRule = (doc, y, color = COLORS.lineGray) => {
  setDraw(doc, color);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
};

// ── Helper: format date ──
const formatDate = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
};

// ── Helper: generate short reference ID ──
const generateRefId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random    = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `SB-${timestamp}-${random}`;
};

// ══════════════════════════════════════════════════
// MAIN EXPORT FUNCTION
// ══════════════════════════════════════════════════
export const generateFormPDF = ({
  formName      = 'Bank Form',
  fields        = [],
  userName      = '',
  accountNumber = '',
}) => {

  const doc    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const refId  = generateRefId();
  const today  = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  let y = 0;   // current Y cursor — moves down as we add content

  // ══════════════════════════════════════════════
  // SECTION 1 — BANK HEADER
  // ══════════════════════════════════════════════

  // Header background rectangle
  setFill(doc, COLORS.darkBlue);
  doc.rect(0, 0, PAGE_W, 34, 'F');

  // Bank name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  setTextColor(doc, COLORS.white);
  doc.text('SMARTBANK', MARGIN, 14);

  // Tagline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  setTextColor(doc, [180, 210, 240]);
  doc.text('AI-Powered Customer Service', MARGIN, 20);

  // Top-right: date and reference
  doc.setFontSize(8);
  setTextColor(doc, [180, 210, 240]);
  doc.text(`Date : ${today}`, PAGE_W - MARGIN, 12, { align: 'right' });
  doc.text(`Ref  : ${refId}`, PAGE_W - MARGIN, 18, { align: 'right' });
  doc.text('Branch Copy', PAGE_W - MARGIN, 24, { align: 'right' });

  y = 34;

  // ══════════════════════════════════════════════
  // SECTION 2 — FORM TITLE BAR
  // ══════════════════════════════════════════════

  setFill(doc, COLORS.lightBlue);
  doc.rect(0, y, PAGE_W, 14, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  setTextColor(doc, COLORS.darkBlue);
  doc.text(formName.toUpperCase(), PAGE_W / 2, y + 9, { align: 'center' });

  y += 20;

  // ══════════════════════════════════════════════
  // SECTION 3 — AUTO-FILLED FIELDS
  // (shown as a summary info block)
  // ══════════════════════════════════════════════

  const autoFields   = fields.filter((f) => f.autoFilled && f.type !== 'signature');
  const manualFields = fields.filter((f) => !f.autoFilled && f.type !== 'signature');
  const signField    = fields.find((f) => f.type === 'signature');

  if (autoFields.length > 0) {

    // Section heading
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setTextColor(doc, COLORS.midBlue);
    doc.text('CUSTOMER INFORMATION', MARGIN, y);
    drawHRule(doc, y + 2);
    y += 8;

    // Draw each auto-filled field as a 2-column row
    autoFields.forEach((field, index) => {

      // Alternate row background
      if (index % 2 === 0) {
        setFill(doc, [248, 251, 254]);
        doc.rect(MARGIN, y - 4, CONTENT_W, 9, 'F');
      }

      // Label — left side
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      setTextColor(doc, COLORS.midBlue);
      doc.text(`${field.label}`, MARGIN + 2, y);

      // Colon separator
      doc.text(':', MARGIN + 58, y);

      // Value — right side
      doc.setFont('helvetica', 'normal');
      setTextColor(doc, COLORS.black);
      const value = field.value || '—';
      doc.text(value, MARGIN + 64, y);

      y += 9;
    });

    y += 4;
  }

  // ══════════════════════════════════════════════
  // SECTION 4 — MANUAL FIELDS (user-filled)
  // ══════════════════════════════════════════════

  if (manualFields.length > 0) {

    // Section heading
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setTextColor(doc, COLORS.midBlue);
    doc.text('FORM DETAILS', MARGIN, y);
    drawHRule(doc, y + 2);
    y += 8;

    manualFields.forEach((field) => {

      // Field label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      setTextColor(doc, COLORS.darkBlue);
      doc.text(`${field.label}`, MARGIN, y);

      y += 5;

      // Value box — outlined rectangle
      const boxH = 9;
      setDraw(doc, COLORS.lineGray);
      doc.setLineWidth(0.4);
      setFill(doc, COLORS.white);
      doc.rect(MARGIN, y, CONTENT_W, boxH, 'FD');

      // Value text inside box
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      setTextColor(doc, COLORS.black);
      const value = field.value || '';
      if (value) {
        doc.text(value, MARGIN + 3, y + 6);
      } else {
        // Empty placeholder
        doc.setFontSize(8);
        setTextColor(doc, [180, 190, 200]);
        doc.text('(not filled)', MARGIN + 3, y + 6);
      }

      y += boxH + 5;
    });
  }

  // ══════════════════════════════════════════════
  // SECTION 5 — SIGNATURE SECTION
  // ══════════════════════════════════════════════

  // Ensure there's enough space for signature section
  // If too close to bottom, add a new page
  if (y > PAGE_H - 70) {
    doc.addPage();
    y = 20;
  }

  y += 4;
  drawHRule(doc, y, COLORS.darkBlue);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setTextColor(doc, COLORS.midBlue);
  doc.text('AUTHORISATION', MARGIN, y);
  y += 8;

  // Two signature boxes side by side
  const sigBoxW = (CONTENT_W - 10) / 2;
  const sigBoxH = 28;

  // Left box — Customer Signature
  setDraw(doc, COLORS.lineGray);
  doc.setLineWidth(0.4);
  setFill(doc, [250, 252, 255]);
  doc.rect(MARGIN, y, sigBoxW, sigBoxH, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  setTextColor(doc, COLORS.midBlue);
  doc.text('Customer Signature', MARGIN + sigBoxW / 2, y + sigBoxH - 5, { align: 'center' });

  // Signature label line
  setDraw(doc, COLORS.lineGray);
  doc.setLineWidth(0.3);
  doc.line(MARGIN + 8, y + sigBoxH - 10, MARGIN + sigBoxW - 8, y + sigBoxH - 10);

  // Right box — Bank Official
  const rightBoxX = MARGIN + sigBoxW + 10;
  setFill(doc, [250, 252, 255]);
  doc.rect(rightBoxX, y, sigBoxW, sigBoxH, 'FD');

  doc.text('Bank Official & Stamp', rightBoxX + sigBoxW / 2, y + sigBoxH - 5, { align: 'center' });
  doc.line(rightBoxX + 8, y + sigBoxH - 10, rightBoxX + sigBoxW - 8, y + sigBoxH - 10);

  y += sigBoxH + 6;

  // ══════════════════════════════════════════════
  // SECTION 6 — TERMS NOTE
  // ══════════════════════════════════════════════

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  setTextColor(doc, [150, 160, 170]);
  const terms = [
    'I hereby declare that the information provided above is true and correct to the best of my knowledge.',
    'I authorise SmartBank to process this request in accordance with the bank\'s terms and conditions.',
  ];
  terms.forEach((line) => {
    doc.text(line, PAGE_W / 2, y, { align: 'center', maxWidth: CONTENT_W });
    y += 5;
  });

  // ══════════════════════════════════════════════
  // SECTION 7 — FOOTER
  // ══════════════════════════════════════════════

  const footerY = PAGE_H - 14;

  // Footer background bar
  setFill(doc, COLORS.darkBlue);
  doc.rect(0, footerY - 4, PAGE_W, 18, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  setTextColor(doc, [180, 210, 240]);

  // Left — system generated notice
  doc.text('Generated by SmartBank AI Kiosk System', MARGIN, footerY + 5);

  // Right — reference ID
  doc.text(`Ref: ${refId}`, PAGE_W - MARGIN, footerY + 5, { align: 'right' });

  // Centre — page number
  doc.text('Page 1 of 1', PAGE_W / 2, footerY + 5, { align: 'center' });

  // ══════════════════════════════════════════════
  // SAVE AND DOWNLOAD
  // ══════════════════════════════════════════════

  // Build filename: "Cheque_Book_Request_SB00100001_20260507.pdf"
  const safeName   = formName.replace(/\s+/g, '_');
  const dateStr    = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const accSuffix  = accountNumber ? `_${accountNumber}` : '';
  const filename   = `${safeName}${accSuffix}_${dateStr}.pdf`;

  doc.save(filename);
};