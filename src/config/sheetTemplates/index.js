// Registry of all sheet template definitions

import { TEST_CASES_DATA_TEMPLATE } from './testCasesData';
import { PRICING_TEMPLATE } from './pricing';
import { BOOKING_TEMPLATE } from './booking';
import { RETRIEVE_TEMPLATE } from './retrieve';
import { SEATS_TEMPLATE } from './seats';
import { SERVICES_TEMPLATE } from './services';

// All templates in output sheet order
export const ALL_TEMPLATES = [
  TEST_CASES_DATA_TEMPLATE,
  PRICING_TEMPLATE,
  SEATS_TEMPLATE,
  BOOKING_TEMPLATE,
  RETRIEVE_TEMPLATE,
  SERVICES_TEMPLATE,
];

// Map: XML root element name → template
export const TEMPLATE_BY_ROOT_ELEMENT = {};
for (const t of ALL_TEMPLATES) {
  TEMPLATE_BY_ROOT_ELEMENT[t.detectByRootElement] = t;
}

// Map: sheet name → template
export const TEMPLATE_BY_SHEET_NAME = {};
for (const t of ALL_TEMPLATES) {
  TEMPLATE_BY_SHEET_NAME[t.sheetName] = t;
}

// Lookup sheets to copy as-is from source Excel
export const LOOKUP_SHEET_NAMES = [
  'PCC Details',
  'FOP Details',
  'ContactInfo',
  'TravelerDetails',
];

// Detect which template matches an XML string (by root element)
export function detectTemplate(xmlString) {
  if (!xmlString || !xmlString.trim()) return null;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');
    if (doc.querySelector('parsererror')) return null;
    const rootName = doc.documentElement.localName || doc.documentElement.nodeName.split(':').pop();
    return TEMPLATE_BY_ROOT_ELEMENT[rootName] || null;
  } catch {
    return null;
  }
}
