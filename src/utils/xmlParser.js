import * as XLSX from 'xlsx';

export function validateXml(xmlString) {
  if (!xmlString || !xmlString.trim()) {
    return { valid: false, error: 'Empty XML' };
  }
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      return { valid: false, error: parseError.textContent.split('\n')[0] };
    }
    return { valid: true, error: null };
  } catch (e) {
    return { valid: false, error: e.message };
  }
}

export function detectSoapEnvelope(xmlString) {
  if (!xmlString) return false;
  const lower = xmlString.toLowerCase();
  return lower.includes('envelope') && (lower.includes('soap') || lower.includes('soapenv') || lower.includes('http://schemas.xmlsoap.org'));
}

export function parseXmlToNodes(xmlString) {
  if (!xmlString || !xmlString.trim()) return [];
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');
    if (doc.querySelector('parsererror')) return [];
    const nodes = [];
    function traverse(node, path) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const localName = node.localName || node.nodeName.split(':').pop();
        const currentPath = path ? `${path}/${localName}` : localName;
        if (node.attributes) {
          for (let i = 0; i < node.attributes.length; i++) {
            const attr = node.attributes[i];
            if (!attr.name.startsWith('xmlns')) {
              nodes.push({
                path: `${currentPath}/@${attr.name}`,
                value: attr.value,
                type: 'attribute',
              });
            }
          }
        }
        const textContent = Array.from(node.childNodes)
          .filter((c) => c.nodeType === Node.TEXT_NODE)
          .map((c) => c.textContent.trim())
          .join('');
        if (textContent) {
          nodes.push({
            path: currentPath,
            value: textContent,
            type: 'text',
          });
        }
        for (const child of node.children) {
          traverse(child, currentPath);
        }
      }
    }
    traverse(doc.documentElement, '');
    return nodes;
  } catch {
    return [];
  }
}

export function extractValueByPath(xmlString, xpath) {
  if (!xmlString || !xpath) return '';
  const nodes = parseXmlToNodes(xmlString);
  const found = nodes.find((n) => n.path === xpath || n.path.endsWith(xpath));
  return found ? found.value : '';
}

export function detectRequestTypes(xmlString) {
  if (!xmlString || !xmlString.trim()) return [];
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');
    if (doc.querySelector('parsererror')) return [];

    const requests = [];
    const bodyElements = doc.querySelectorAll('*');
    const knownTypes = ['Login', 'Search', 'Booking', 'Payment', 'Cancel', 'Status'];
    const seen = new Set();

    for (const el of bodyElements) {
      const name = el.localName || el.nodeName.split(':').pop();
      for (const type of knownTypes) {
        if (name.toLowerCase().includes(type.toLowerCase()) && !seen.has(type)) {
          seen.add(type);
          const serializer = new XMLSerializer();
          requests.push({
            type: `${type}Request`,
            xml: serializer.serializeToString(el),
          });
        }
      }
    }
    return requests;
  } catch {
    return [];
  }
}

export function generatePreviewData(testCases, requestTabs, mappings) {
  const sheets = [];
  for (const tab of requestTabs) {
    if (!tab.enabled) continue;
    const rows = [];
    for (const tc of testCases) {
      const xml = tc.data[tab.name] || '';
      if (!xml.trim()) continue;
      const row = { TestCaseID: tc.id };
      if (mappings.length > 0) {
        for (const mapping of mappings) {
          if (mapping.xpath && mapping.column) {
            row[mapping.column] = extractValueByPath(xml, mapping.xpath);
          }
        }
      } else {
        const nodes = parseXmlToNodes(xml);
        for (const node of nodes) {
          const colName = node.path.split('/').pop().replace('@', '');
          if (!row[colName]) {
            row[colName] = node.value;
          }
        }
      }
      rows.push(row);
    }
    if (rows.length > 0) {
      sheets.push({ sheetName: tab.name, rows });
    }
  }
  return sheets;
}

export function exportToExcel(testCases, requestTabs, mappings, fileName) {
  const sheets = generatePreviewData(testCases, requestTabs, mappings);
  if (sheets.length === 0) {
    alert('No data to export. Please paste XML in at least one enabled request block.');
    return;
  }
  const wb = XLSX.utils.book_new();
  const usedNames = new Set();
  for (const sheet of sheets) {
    let safeName = sheet.sheetName.replace(/[\\\/*?:\[\]]/g, '').slice(0, 31);
    if (!safeName) safeName = 'Sheet';
    let uniqueName = safeName;
    let counter = 1;
    while (usedNames.has(uniqueName)) {
      uniqueName = `${safeName.slice(0, 28)}_${counter++}`;
    }
    usedNames.add(uniqueName);
    const ws = XLSX.utils.json_to_sheet(sheet.rows);
    const colWidths = Object.keys(sheet.rows[0]).map((key) => ({
      wch: Math.max(key.length, ...sheet.rows.map((r) => String(r[key] || '').length)) + 2,
    }));
    ws['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, uniqueName);
  }
  const finalName = fileName || `XMLParsed_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, finalName);
  return finalName;
}

export function suggestColumnNames(xmlString) {
  const nodes = parseXmlToNodes(xmlString);
  const suggestions = [];
  const seen = new Set();
  for (const node of nodes) {
    const parts = node.path.split('/');
    const colName = parts[parts.length - 1].replace('@', '');
    if (!seen.has(colName)) {
      seen.add(colName);
      suggestions.push({ xpath: node.path, column: colName });
    }
  }
  return suggestions;
}
