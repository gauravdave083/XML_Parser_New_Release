// Utility to read an Excel file (via browser File API) and return the parsed workbook
// so that lookup sheets can be copied into the exported workbook.

import * as XLSX from 'xlsx';

// Read a File object (from <input type="file">) and return a promise resolving to an XLSX workbook
export function readExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        resolve(workbook);
      } catch (err) {
        reject(new Error('Failed to parse Excel file: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}
