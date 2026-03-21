const XLSX = require('xlsx');
const fs = require('fs');
const path = 'C:\\Projects_EK_EKD\\SSR INST\\SSR_INST_Testcases_TCG.xlsx';
const wb = XLSX.readFile(path);

let output = '';
output += 'SHEET NAMES: ' + JSON.stringify(wb.SheetNames) + '\n\n';

wb.SheetNames.forEach(name => {
  const ws = wb.Sheets[name];
  const ref = ws['!ref'] || 'A1';
  const range = XLSX.utils.decode_range(ref);
  const totalRows = range.e.r + 1;
  const totalCols = range.e.c + 1;
  output += '========================================\n';
  output += 'SHEET: ' + name + ' | Rows: ' + totalRows + ' | Cols: ' + totalCols + '\n';
  output += '========================================\n';
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  // Show first 5 rows with ALL columns
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const row = data[i];
    output += 'Row ' + i + ':\n';
    for (let c = 0; c < row.length; c++) {
      if (row[c] !== '') {
        output += '  Col' + c + ': ' + JSON.stringify(row[c]) + '\n';
      }
    }
  }
  output += '\n';
});

fs.writeFileSync('excel_structure.txt', output, 'utf8');
console.log('Done. Written to excel_structure.txt');
