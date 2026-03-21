// Template-aware export engine
// Builds Excel workbook matching the SSR_INST_Testcases_TCG.xlsx format exactly.

import * as XLSX from 'xlsx';
import { ALL_TEMPLATES, detectTemplate, LOOKUP_SHEET_NAMES } from '../config/sheetTemplates/index';
import { EXTRACTORS, extractBySimplePath } from './extractors';

// Extract a single column value from a parsed XML document
function extractColumnValue(colDef, xmlDoc, testCaseId) {
  // Static default value
  if (colDef.defaultValue !== undefined && colDef.defaultValue !== null) {
    return colDef.defaultValue;
  }
  // Source-based value
  if (colDef.source === 'testCaseId') {
    return testCaseId;
  }
  if (colDef.source === 'userInput') {
    return ''; // user fills manually later
  }
  // Named extractor
  if (colDef.extractor && EXTRACTORS[colDef.extractor]) {
    return EXTRACTORS[colDef.extractor](xmlDoc);
  }
  // Simple XPath
  if (colDef.xpath) {
    return extractBySimplePath(xmlDoc, colDef.xpath);
  }
  return '';
}

// Build the max column index from a template's columns
function getMaxCol(template, mode) {
  const cols = mode === 'NDC' ? template.ndcColumns : template.flxColumns;
  let max = 0;
  for (const c of cols) {
    if (c.col > max) max = c.col;
  }
  // Also check the other mode's columns for header row
  const otherCols = mode === 'NDC' ? template.flxColumns : template.ndcColumns;
  for (const c of otherCols) {
    if (c.col > max) max = c.col;
  }
  return max;
}

// Build header arrays for Row 0 (sections), Row 1 (NDC), Row 2 (FLX)
function buildHeaders(template, maxCol) {
  const row0 = new Array(maxCol + 1).fill('');
  const row1 = new Array(maxCol + 1).fill('');
  const row2 = new Array(maxCol + 1).fill('');

  // Row 0: section headers
  if (template.sectionHeaders) {
    for (const [colStr, text] of Object.entries(template.sectionHeaders)) {
      const col = parseInt(colStr, 10);
      if (col <= maxCol) row0[col] = text;
    }
  }

  // Row 1: NDC headers
  for (const colDef of template.ndcColumns) {
    if (colDef.col <= maxCol) row1[colDef.col] = colDef.header;
  }

  // Row 2: FLX headers
  for (const colDef of template.flxColumns) {
    if (colDef.col <= maxCol) row2[colDef.col] = colDef.header;
  }

  return { row0, row1, row2 };
}

// Extract one data row from XML for a given template + mode
function extractDataRow(template, mode, xmlString, testCaseId) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');
  if (doc.querySelector('parsererror')) return null;

  const columns = mode === 'NDC' ? template.ndcColumns : template.flxColumns;
  const maxCol = getMaxCol(template, mode);
  const row = new Array(maxCol + 1).fill('');

  for (const colDef of columns) {
    const value = extractColumnValue(colDef, doc, testCaseId);
    if (value !== '' && value !== null && value !== undefined) {
      row[colDef.col] = value;
    }
  }

  return row;
}

// Generate preview data for all test cases, organized by template sheet
export function generateTemplatePreviewData(testCases, requestTabs, mode) {
  const sheets = [];

  for (const template of ALL_TEMPLATES) {
    const dataRows = [];

    for (const tc of testCases) {
      // Find which request tab's XML matches this template
      for (const tab of requestTabs) {
        if (!tab.enabled) continue;
        const xml = tc.data[tab.name] || '';
        if (!xml.trim()) continue;

        const detected = detectTemplate(xml);
        if (detected && detected.sheetName === template.sheetName) {
          const row = extractDataRow(template, mode, xml, tc.id);
          if (row) dataRows.push(row);
        }
      }
    }

    if (dataRows.length > 0) {
      const maxCol = getMaxCol(template, mode);
      const { row0, row1, row2 } = buildHeaders(template, maxCol);

      sheets.push({
        sheetName: template.sheetName,
        sectionHeaders: template.sectionHeaders || {},
        sectionMerges: template.sectionMerges || [],
        row0,
        row1,
        row2,
        dataRows,
        maxCol,
      });
    }
  }

  return sheets;
}

// Build and download the Excel workbook
export function exportTemplateToExcel(testCases, requestTabs, mode, lookupWorkbook) {
  const sheets = generateTemplatePreviewData(testCases, requestTabs, mode);

  if (sheets.length === 0) {
    alert('No data to export. Paste XML in at least one enabled request block.');
    return;
  }

  const wb = XLSX.utils.book_new();

  // Add data sheets
  for (const sheet of sheets) {
    const aoaData = [sheet.row0, sheet.row1, sheet.row2, ...sheet.dataRows];
    const ws = XLSX.utils.aoa_to_sheet(aoaData);

    // Apply section merges (Row 0)
    if (sheet.sectionMerges && sheet.sectionMerges.length > 0) {
      ws['!merges'] = sheet.sectionMerges.map(([startCol, endCol]) => ({
        s: { r: 0, c: startCol },
        e: { r: 0, c: endCol },
      }));
    }

    // Set column widths
    const colWidths = [];
    for (let c = 0; c <= sheet.maxCol; c++) {
      let maxLen = 8;
      // Check header rows
      if (sheet.row1[c]) maxLen = Math.max(maxLen, String(sheet.row1[c]).length);
      if (sheet.row2[c]) maxLen = Math.max(maxLen, String(sheet.row2[c]).length);
      // Check data rows
      for (const row of sheet.dataRows) {
        if (row[c]) maxLen = Math.max(maxLen, String(row[c]).length);
      }
      colWidths.push({ wch: Math.min(maxLen + 2, 40) });
    }
    ws['!cols'] = colWidths;

    const safeName = sheet.sheetName.replace(/[\\\/*?:\[\]]/g, '').slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, safeName);
  }

  // Add lookup sheets from source workbook (if provided)
  if (lookupWorkbook) {
    for (const sheetName of LOOKUP_SHEET_NAMES) {
      if (lookupWorkbook.SheetNames.includes(sheetName)) {
        const sourceWs = lookupWorkbook.Sheets[sheetName];
        if (sourceWs) {
          const safeName = sheetName.replace(/[\\\/*?:\[\]]/g, '').slice(0, 31);
          // Only add if not already present
          if (!wb.SheetNames.includes(safeName)) {
            XLSX.utils.book_append_sheet(wb, sourceWs, safeName);
          }
        }
      }
    }
  }

  const fileName = `SSR_INST_Export_${mode}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return fileName;
}
