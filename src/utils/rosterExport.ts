import { RosterAdminMonth, RosterConfig, RosterPublicMonth } from '../types/portal';
import {
  THAI_MONTHS,
  THAI_DAYS_SHORT,
  getDaysInMonth,
  getDayOfWeek,
  formatThaiMonthYear,
} from '../data/rosterData';

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Export full confidential shift roster + pay rates + totals + signatories to a genuine .xlsx Excel workbook
 * (Admin Backend ONLY)
 */
export async function exportAdminRosterToExcel(
  roster: RosterAdminMonth,
  config: RosterConfig
): Promise<void> {
  const ExcelJSModule = await import('exceljs');
  const ExcelJS = (ExcelJSModule.default || ExcelJSModule) as typeof import('exceljs');

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'กลุ่มงานเภสัชกรรมและคุ้มครองผู้บริโภค';
  workbook.created = new Date();

  const daysCount = getDaysInMonth(roster.yearAD, roster.month);
  const totalCols = 3 + daysCount + 2; // ชื่อ-สกุล, ตำแหน่ง, เวรละ, 1..N, จำนวน, จำนวนเงิน
  const thaiMonthLabel = formatThaiMonthYear(roster.yearAD, roster.month);

  const sheet = workbook.addWorksheet(`ตารางเวร ${THAI_MONTHS[roster.month - 1]}`, {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      margins: {
        left: 0.25,
        right: 0.25,
        top: 0.35,
        bottom: 0.35,
        header: 0.15,
        footer: 0.15,
      },
    },
  });

  const thinBorder = {
    top: { style: 'thin' as const, color: { argb: 'FF000000' } },
    left: { style: 'thin' as const, color: { argb: 'FF000000' } },
    bottom: { style: 'thin' as const, color: { argb: 'FF000000' } },
    right: { style: 'thin' as const, color: { argb: 'FF000000' } },
  };

  const holidayFill = {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb: 'FFE7EFE0' },
  };

  const headerFill = {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb: 'FFF7F7EC' },
  };

  const baseFont = { name: 'TH SarabunPSK', size: 13, color: { argb: 'FF000000' } };

  // Set Column Widths
  sheet.getColumn(1).width = 23; // ชื่อ-สกุล
  sheet.getColumn(2).width = 18; // ตำแหน่ง
  sheet.getColumn(3).width = 11; // เวรละ
  for (let d = 1; d <= daysCount; d++) {
    sheet.getColumn(3 + d).width = 3.4;
  }
  sheet.getColumn(3 + daysCount + 1).width = 9.5; // จำนวน
  sheet.getColumn(3 + daysCount + 2).width = 11.5; // จำนวนเงิน

  // Row 1: Title
  sheet.mergeCells(1, 1, 1, totalCols);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = `${roster.title} ประจำเดือน ${thaiMonthLabel}`;
  titleCell.font = { ...baseFont, size: 15, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 24;

  // Row 2: Spacer
  sheet.getRow(2).height = 8;

  // Row 3: Table Headers
  const headerRowIndex = 3;
  const headerRow = sheet.getRow(headerRowIndex);
  headerRow.height = 24;

  const headers: string[] = [
    'ชื่อ-สกุล',
    'ตำแหน่ง',
    'เวรละ',
    ...Array.from({ length: daysCount }, (_, i) => String(i + 1)),
    'จำนวน',
    'จำนวนเงิน',
  ];

  headers.forEach((label, idx) => {
    const col = idx + 1;
    const cell = sheet.getCell(headerRowIndex, col);
    cell.value = label;
    cell.font = { ...baseFont, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;

    if (col >= 4 && col <= 3 + daysCount) {
      const dayNum = col - 3;
      cell.fill = roster.holidays.includes(dayNum) ? holidayFill : headerFill;
    } else {
      cell.fill = headerFill;
    }
  });

  // Staff Rows (2 rows per staff)
  let currentRow = headerRowIndex + 1;
  const sortedRows = [...roster.rows].sort((a, b) => a.order - b.order);
  let grandTotal = 0;

  for (const row of sortedRows) {
    const mCount = row.morningDays.length;
    const aCount = row.afternoonDays.length;
    const rowAmount = mCount * row.morningRate + aCount * row.afternoonRate;
    grandTotal += rowAmount;

    const topRowIdx = currentRow;
    const bottomRowIdx = currentRow + 1;
    sheet.getRow(topRowIdx).height = 20;
    sheet.getRow(bottomRowIdx).height = 20;

    // Merge ชื่อ-สกุล, ตำแหน่ง, จำนวน, จำนวนเงิน vertically
    sheet.mergeCells(topRowIdx, 1, bottomRowIdx, 1);
    sheet.mergeCells(topRowIdx, 2, bottomRowIdx, 2);
    sheet.mergeCells(topRowIdx, totalCols - 1, bottomRowIdx, totalCols - 1);
    sheet.mergeCells(topRowIdx, totalCols, bottomRowIdx, totalCols);

    const nameCell = sheet.getCell(topRowIdx, 1);
    nameCell.value = row.name;
    nameCell.font = baseFont;
    nameCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };

    const posCell = sheet.getCell(topRowIdx, 2);
    posCell.value = row.position;
    posCell.font = baseFont;
    posCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

    const morningRateCell = sheet.getCell(topRowIdx, 3);
    morningRateCell.value = `${row.morningRate} (ช):`;
    morningRateCell.font = baseFont;
    morningRateCell.alignment = { horizontal: 'right', vertical: 'middle' };

    const afternoonRateCell = sheet.getCell(bottomRowIdx, 3);
    afternoonRateCell.value = `${row.afternoonRate} (บ):`;
    afternoonRateCell.font = baseFont;
    afternoonRateCell.alignment = { horizontal: 'right', vertical: 'middle' };

    for (let d = 1; d <= daysCount; d++) {
      const col = 3 + d;
      const isHol = roster.holidays.includes(d);

      const mCell = sheet.getCell(topRowIdx, col);
      mCell.value = row.morningDays.includes(d) ? 'ช' : '';
      mCell.font = baseFont;
      mCell.alignment = { horizontal: 'center', vertical: 'middle' };
      if (isHol) mCell.fill = holidayFill;

      const aCell = sheet.getCell(bottomRowIdx, col);
      aCell.value = row.afternoonDays.includes(d) ? 'บ' : '';
      aCell.font = baseFont;
      aCell.alignment = { horizontal: 'center', vertical: 'middle' };
      if (isHol) aCell.fill = holidayFill;
    }

    const countCell = sheet.getCell(topRowIdx, totalCols - 1);
    countCell.value = `ช : ${mCount}\nบ : ${aCount}`;
    countCell.font = baseFont;
    countCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

    const amountCell = sheet.getCell(topRowIdx, totalCols);
    amountCell.value = rowAmount;
    amountCell.numFmt = '#,##0';
    amountCell.font = { ...baseFont, bold: true };
    amountCell.alignment = { horizontal: 'right', vertical: 'middle' };

    // Apply borders to all cells in both rows
    for (let r = topRowIdx; r <= bottomRowIdx; r++) {
      for (let c = 1; c <= totalCols; c++) {
        sheet.getCell(r, c).border = thinBorder;
      }
    }

    currentRow += 2;
  }

  // Grand Total Row
  const totalRowIdx = currentRow;
  sheet.getRow(totalRowIdx).height = 22;
  sheet.mergeCells(totalRowIdx, 1, totalRowIdx, totalCols - 1);

  const totalLabelCell = sheet.getCell(totalRowIdx, 1);
  totalLabelCell.value = 'รวมทั้งสิ้น';
  totalLabelCell.font = { ...baseFont, bold: true };
  totalLabelCell.alignment = { horizontal: 'center', vertical: 'middle' };

  const totalValCell = sheet.getCell(totalRowIdx, totalCols);
  totalValCell.value = grandTotal;
  totalValCell.numFmt = '#,##0';
  totalValCell.font = { ...baseFont, bold: true };
  totalValCell.alignment = { horizontal: 'right', vertical: 'middle' };

  for (let c = 1; c <= totalCols; c++) {
    sheet.getCell(totalRowIdx, c).border = thinBorder;
  }

  // Legend Section
  const legendStart = totalRowIdx + 2;
  sheet.getCell(legendStart, 1).value = 'หมายเหตุ:';
  sheet.getCell(legendStart, 1).font = { ...baseFont, bold: true };
  sheet.getCell(legendStart, 3).value = config.morningLabel;
  sheet.getCell(legendStart, 3).font = baseFont;
  sheet.getCell(legendStart + 1, 3).value = config.afternoonLabel;
  sheet.getCell(legendStart + 1, 3).font = baseFont;

  // Signatories Section
  const sigStart = legendStart + 4;
  const leftEndCol = Math.floor(totalCols / 2);
  const rightStartCol = leftEndCol + 1;

  const sigLines: Array<[string, string, boolean]> = [
    ['........................................................', '........................................................', false],
    [config.leftSignatoryName || '', config.rightSignatoryName || '', true],
    [config.leftSignatoryPosition || '', config.rightSignatoryPosition || '', false],
    [config.leftSignatoryRole || '', config.rightSignatoryRole || '', false],
  ];

  sigLines.forEach(([leftText, rightText, isBold], offset) => {
    const r = sigStart + offset;
    sheet.mergeCells(r, 1, r, leftEndCol);
    sheet.mergeCells(r, rightStartCol, r, totalCols);

    const lCell = sheet.getCell(r, 1);
    lCell.value = leftText;
    lCell.font = { ...baseFont, bold: isBold };
    lCell.alignment = { horizontal: 'center', vertical: 'middle' };

    const rCell = sheet.getCell(r, rightStartCol);
    rCell.value = rightText;
    rCell.font = { ...baseFont, bold: isBold };
    rCell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const filename = `ตารางเวร_กลุ่มงานเภสัชกรรม_${THAI_MONTHS[roster.month - 1]}_${roster.yearAD + 543}.xlsx`;
  triggerBlobDownload(blob, filename);
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Render high-resolution PNG image of the public monthly shift roster
 * (Strictly NO pay rates, NO money, NO signatories)
 */
export async function exportPublicRosterToPng(roster: RosterPublicMonth): Promise<void> {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const daysCount = getDaysInMonth(roster.yearAD, roster.month);
  const sortedRows = [...roster.rows].sort((a, b) => a.order - b.order);

  const canvasWidth = 2400;
  const outerPad = 56;
  const cardX = outerPad;
  const cardY = outerPad;
  const cardW = canvasWidth - outerPad * 2;
  const headerH = 128;
  const tableHeaderH = 74;
  const shiftRowH = 44;
  const staffBlockH = shiftRowH * 2;
  const footerH = roster.note ? 132 : 104;
  const cardH = headerH + tableHeaderH + sortedRows.length * staffBlockH + footerH;
  const canvasHeight = cardH + outerPad * 2;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('ไม่สามารถสร้างรูปภาพได้บนเบราว์เซอร์นี้');
  }

  const fontFamily = "'Prompt', 'Plus Jakarta Sans', 'Sarabun', sans-serif";

  // 1. Warm Sand Background (#E6D5B7)
  ctx.fillStyle = '#E6D5B7';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 2. Main White Card
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 32);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(30, 34, 61, 0.14)';
  ctx.stroke();

  // 3. Card Top Header (#F9F5EE)
  ctx.save();
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 32);
  ctx.clip();

  ctx.fillStyle = '#F9F5EE';
  ctx.fillRect(cardX, cardY, cardW, headerH);

  // Header bottom border
  ctx.strokeStyle = 'rgba(30, 34, 61, 0.12)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cardX, cardY + headerH);
  ctx.lineTo(cardX + cardW, cardY + headerH);
  ctx.stroke();

  // Title & Subtitle
  const thaiMonthYear = formatThaiMonthYear(roster.yearAD, roster.month);
  ctx.fillStyle = '#1E223D';
  ctx.font = `700 32px ${fontFamily}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${roster.title} ประจำเดือน ${thaiMonthYear}`, cardX + 36, cardY + 48);

  ctx.fillStyle = '#4B5277';
  ctx.font = `500 20px ${fontFamily}`;
  ctx.fillText(
    'ตารางปฏิบัติงานสำหรับบุคลากร (ฉบับเผยแพร่ทั่วไป · ไม่แสดงข้อมูลค่าตอบแทน)',
    cardX + 36,
    cardY + 90
  );

  // Holiday Legend on top right
  const legendBoxX = cardX + cardW - 310;
  const legendBoxY = cardY + 48;
  drawRoundedRect(ctx, legendBoxX, legendBoxY, 26, 26, 6);
  ctx.fillStyle = '#EAF2E3';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#6EE7B7';
  ctx.stroke();

  ctx.fillStyle = '#4B5277';
  ctx.font = `500 20px ${fontFamily}`;
  ctx.textAlign = 'left';
  ctx.fillText('วันหยุดราชการ / ส.-อา.', legendBoxX + 38, legendBoxY + 14);

  // 4. Table Geometry (Fits 100% of cardW cleanly)
  const colNameW = 290;
  const colPosW = 215;
  const colShiftW = 58;
  const colCountW = 125;
  const daysTotalW = cardW - (colNameW + colPosW + colShiftW + colCountW);
  const colDayW = daysTotalW / daysCount;

  const colXName = cardX;
  const colXPos = colXName + colNameW;
  const colXShift = colXPos + colPosW;
  const colXDaysStart = colXShift + colShiftW;
  const colXCount = colXDaysStart + daysTotalW;

  const tableTopY = cardY + headerH;

  // Table Header Background
  ctx.fillStyle = '#F4EFE6';
  ctx.fillRect(cardX, tableTopY, cardW, tableHeaderH);

  // Header Labels
  ctx.fillStyle = '#1E223D';
  ctx.font = `700 20px ${fontFamily}`;
  ctx.textAlign = 'left';
  ctx.fillText('ชื่อ-สกุล', colXName + 18, tableTopY + tableHeaderH / 2);
  ctx.fillText('ตำแหน่ง', colXPos + 14, tableTopY + tableHeaderH / 2);
  ctx.textAlign = 'center';
  ctx.fillText('เวร', colXShift + colShiftW / 2, tableTopY + tableHeaderH / 2);
  ctx.fillText('จำนวน', colXCount + colCountW / 2, tableTopY + tableHeaderH / 2);

  // Day Headers 1..N
  for (let d = 1; d <= daysCount; d++) {
    const dx = colXDaysStart + (d - 1) * colDayW;
    const isHol = roster.holidays.includes(d);
    const dowLabel = THAI_DAYS_SHORT[getDayOfWeek(roster.yearAD, roster.month, d)];

    if (isHol) {
      ctx.fillStyle = '#EAF2E3';
      ctx.fillRect(dx, tableTopY, colDayW, tableHeaderH);
    }

    ctx.fillStyle = isHol ? '#065F46' : '#1E223D';
    ctx.font = `700 19px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText(String(d), dx + colDayW / 2, tableTopY + 25);

    ctx.fillStyle = isHol ? '#047857' : '#4B5277';
    ctx.font = `500 14px ${fontFamily}`;
    ctx.fillText(dowLabel, dx + colDayW / 2, tableTopY + 52);
  }

  // Table Header Bottom Border
  ctx.strokeStyle = 'rgba(30, 34, 61, 0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cardX, tableTopY + tableHeaderH);
  ctx.lineTo(cardX + cardW, tableTopY + tableHeaderH);
  ctx.stroke();

  // 5. Staff Rows
  let yCursor = tableTopY + tableHeaderH;
  for (const row of sortedRows) {
    const topY = yCursor;
    const botY = yCursor + shiftRowH;

    // Subtle shift label column backgrounds
    ctx.fillStyle = 'rgba(254, 243, 199, 0.65)';
    ctx.fillRect(colXShift, topY, colShiftW, shiftRowH);
    ctx.fillStyle = 'rgba(245, 79, 27, 0.08)';
    ctx.fillRect(colXShift, botY, colShiftW, shiftRowH);

    // Count column background
    ctx.fillStyle = 'rgba(249, 245, 238, 0.7)';
    ctx.fillRect(colXCount, topY, colCountW, staffBlockH);

    // Holiday column shading across both rows
    for (let d = 1; d <= daysCount; d++) {
      if (roster.holidays.includes(d)) {
        const dx = colXDaysStart + (d - 1) * colDayW;
        ctx.fillStyle = 'rgba(234, 242, 227, 0.75)';
        ctx.fillRect(dx, topY, colDayW, staffBlockH);
      }
    }

    // Name & Position (centered vertically across 2 rows)
    ctx.fillStyle = '#1E223D';
    ctx.font = `600 20px ${fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(row.name, colXName + 16, topY + staffBlockH / 2, colNameW - 26);

    ctx.fillStyle = '#4B5277';
    ctx.font = `500 18px ${fontFamily}`;
    ctx.fillText(row.position, colXPos + 14, topY + staffBlockH / 2, colPosW - 22);

    // Shift labels ช / บ
    ctx.textAlign = 'center';
    ctx.fillStyle = '#92400E';
    ctx.font = `700 18px ${fontFamily}`;
    ctx.fillText('ช', colXShift + colShiftW / 2, topY + shiftRowH / 2);

    ctx.fillStyle = '#F54F1B';
    ctx.fillText('บ', colXShift + colShiftW / 2, botY + shiftRowH / 2);

    // Shift badges on day grid
    const badgeSize = 28;
    for (let d = 1; d <= daysCount; d++) {
      const dx = colXDaysStart + (d - 1) * colDayW;
      const centerX = dx + colDayW / 2;

      if (row.morningDays.includes(d)) {
        drawRoundedRect(
          ctx,
          centerX - badgeSize / 2,
          topY + (shiftRowH - badgeSize) / 2,
          badgeSize,
          badgeSize,
          7
        );
        ctx.fillStyle = '#FEF3C7';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#FCD34D';
        ctx.stroke();

        ctx.fillStyle = '#78350F';
        ctx.font = `700 17px ${fontFamily}`;
        ctx.fillText('ช', centerX, topY + shiftRowH / 2 + 1);
      }

      if (row.afternoonDays.includes(d)) {
        drawRoundedRect(
          ctx,
          centerX - badgeSize / 2,
          botY + (shiftRowH - badgeSize) / 2,
          badgeSize,
          badgeSize,
          7
        );
        ctx.fillStyle = 'rgba(245, 79, 27, 0.16)';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(245, 79, 27, 0.45)';
        ctx.stroke();

        ctx.fillStyle = '#C83A0E';
        ctx.font = `700 17px ${fontFamily}`;
        ctx.fillText('บ', centerX, botY + shiftRowH / 2 + 1);
      }
    }

    // Shift Counts (ช : x / บ : y)
    ctx.font = `700 18px ${fontFamily}`;
    ctx.fillStyle = '#92400E';
    ctx.fillText(`ช : ${row.morningDays.length}`, colXCount + colCountW / 2, topY + shiftRowH / 2);
    ctx.fillStyle = '#F54F1B';
    ctx.fillText(`บ : ${row.afternoonDays.length}`, colXCount + colCountW / 2, botY + shiftRowH / 2);

    // Horizontal inner line between ช and บ (from Shift col across days)
    ctx.strokeStyle = 'rgba(30, 34, 61, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(colXShift, botY);
    ctx.lineTo(colXCount, botY);
    ctx.stroke();

    // Horizontal bottom line after staff block
    ctx.strokeStyle = 'rgba(30, 34, 61, 0.18)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cardX, topY + staffBlockH);
    ctx.lineTo(cardX + cardW, topY + staffBlockH);
    ctx.stroke();

    yCursor += staffBlockH;
  }

  // 6. Vertical Table Grid Lines
  const tableBottomY = yCursor;
  const verticalCols = [
    colXPos,
    colXShift,
    ...Array.from({ length: daysCount }, (_, i) => colXDaysStart + i * colDayW),
    colXCount,
  ];

  verticalCols.forEach((vx, idx) => {
    ctx.strokeStyle =
      idx <= 1 || idx === verticalCols.length - 1
        ? 'rgba(30, 34, 61, 0.16)'
        : 'rgba(30, 34, 61, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(vx, tableTopY);
    ctx.lineTo(vx, tableBottomY);
    ctx.stroke();
  });

  // 7. Footer (Legend + Note + Updated Timestamp)
  ctx.fillStyle = '#F9F5EE';
  ctx.fillRect(cardX, tableBottomY, cardW, footerH);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#1E223D';
  ctx.font = `700 19px ${fontFamily}`;
  ctx.fillText('หมายเหตุ:', cardX + 36, tableBottomY + 34);

  ctx.fillStyle = '#4B5277';
  ctx.font = `500 19px ${fontFamily}`;
  ctx.fillText('1 ช หมายถึง เวลาปฏิบัติงานในช่วงเวลา 8.00 – 16.00 น.', cardX + 135, tableBottomY + 34);
  ctx.fillText('2 บ หมายถึง เวลาปฏิบัติงานในช่วงเวลา 16.01 – 20.00 น.', cardX + 135, tableBottomY + 66);

  if (roster.note) {
    ctx.fillStyle = '#1E223D';
    ctx.font = `500 18px ${fontFamily}`;
    ctx.fillText(`บันทึกเพิ่มเติม: ${roster.note}`, cardX + 135, tableBottomY + 98);
  }

  const updatedLabel = new Date(roster.updatedAt).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  ctx.textAlign = 'right';
  ctx.fillStyle = '#4B5277';
  ctx.font = `500 18px ${fontFamily}`;
  ctx.fillText(`อัปเดตล่าสุด: ${updatedLabel}`, cardX + cardW - 36, tableBottomY + 50);

  ctx.restore();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/png')
  );
  if (!blob) {
    throw new Error('ไม่สามารถบันทึกไฟล์รูปภาพได้');
  }
  const filename = `ตารางเวร_กลุ่มงานเภสัชกรรม_${THAI_MONTHS[roster.month - 1]}_${roster.yearAD + 543}.png`;
  triggerBlobDownload(blob, filename);
}
