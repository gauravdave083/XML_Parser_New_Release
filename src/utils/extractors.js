// Named extractor functions for transforming XML into Excel column values
// Each extractor receives a parsed XML Document and returns a string value.

function getLocalName(el) {
  return el.localName || el.nodeName.split(':').pop();
}

function findElementsByLocalName(parent, localName) {
  const results = [];
  const all = parent.getElementsByTagName('*');
  for (let i = 0; i < all.length; i++) {
    if (getLocalName(all[i]) === localName) {
      results.push(all[i]);
    }
  }
  return results;
}

function findFirstByLocalName(parent, localName) {
  const results = findElementsByLocalName(parent, localName);
  return results.length > 0 ? results[0] : null;
}

function getTextContent(parent, localName) {
  const el = findFirstByLocalName(parent, localName);
  return el ? el.textContent.trim() : '';
}

// --- Origin Destination extractors ---

function getOriginDestinations(doc) {
  return findElementsByLocalName(doc, 'OriginDestination');
}

function formatOD(od) {
  const dep = getTextContent(od, 'AirportCode');
  const arrNodes = findElementsByLocalName(od, 'AirportCode');
  // First AirportCode is departure, look for one inside Arrival
  const arrivalEl = findFirstByLocalName(od, 'Arrival');
  const arr = arrivalEl ? getTextContent(arrivalEl, 'AirportCode') : (arrNodes.length > 1 ? arrNodes[1].textContent.trim() : '');
  const depEl = findFirstByLocalName(od, 'Departure');
  const depCode = depEl ? getTextContent(depEl, 'AirportCode') : dep;
  return depCode && arr ? `${depCode}-${arr}` : '';
}

// Combine first 2 ODs into Market (e.g., "DXB-MCT,MCT-DXB")
export function combineODs(doc) {
  const ods = getOriginDestinations(doc);
  const markets = [];
  for (let i = 0; i < Math.min(ods.length, 2); i++) {
    const m = formatOD(ods[i]);
    if (m) markets.push(m);
  }
  return markets.join(',');
}

// 3rd OD → Market2
export function combineODs_2(doc) {
  const ods = getOriginDestinations(doc);
  if (ods.length < 3) return '';
  return formatOD(ods[2]);
}

// 4th OD → Market3
export function combineODs_3(doc) {
  const ods = getOriginDestinations(doc);
  if (ods.length < 4) return '';
  return formatOD(ods[3]);
}

// --- Travel Dates extractors ---

function getDepartureDates(doc) {
  const ods = getOriginDestinations(doc);
  const dates = [];
  for (const od of ods) {
    const depEl = findFirstByLocalName(od, 'Departure');
    if (depEl) {
      const dateVal = getTextContent(depEl, 'Date');
      if (dateVal) dates.push(dateVal);
    }
  }
  return dates;
}

export function combineDates(doc) {
  const dates = getDepartureDates(doc);
  return dates.slice(0, 2).join(',');
}

export function combineDates_2(doc) {
  const dates = getDepartureDates(doc);
  return dates.length >= 3 ? dates[2] : '';
}

export function combineDates_3(doc) {
  const dates = getDepartureDates(doc);
  return dates.length >= 4 ? dates[3] : '';
}

// --- Time preference extractors ---

export function depTimePreference(doc) {
  const ods = getOriginDestinations(doc);
  const times = [];
  for (const od of ods) {
    const depEl = findFirstByLocalName(od, 'Departure');
    if (depEl) {
      const timeVal = getTextContent(depEl, 'Time');
      if (timeVal) times.push(timeVal);
    }
  }
  return times.join(',');
}

export function arrivalTimePreference(doc) {
  const ods = getOriginDestinations(doc);
  const times = [];
  for (const od of ods) {
    const arrEl = findFirstByLocalName(od, 'Arrival');
    if (arrEl) {
      const timeVal = getTextContent(arrEl, 'Time');
      if (timeVal) times.push(timeVal);
    }
  }
  return times.join(',');
}

// --- Passenger / Traveler extractors ---

function getPassengers(doc) {
  return findElementsByLocalName(doc, 'Passenger');
}

// Count passengers by PTC: "2ADT,1CNN,1INF"
export function countByPTC(doc) {
  const passengers = getPassengers(doc);
  const counts = {};
  const order = [];
  for (const pax of passengers) {
    const ptc = getTextContent(pax, 'PTC');
    if (ptc) {
      if (!counts[ptc]) {
        counts[ptc] = 0;
        order.push(ptc);
      }
      counts[ptc]++;
    }
  }
  return order.map((ptc) => `${counts[ptc]}${ptc}`).join(',');
}

// List all PassengerID attributes: "T1,T2,T3,T1.1"
export function listPassengerIDs(doc) {
  const passengers = getPassengers(doc);
  const ids = [];
  for (const pax of passengers) {
    const id = pax.getAttribute('PassengerID');
    if (id) ids.push(id);
  }
  return ids.join(',');
}

// Same as listPassengerIDs but searches in Query/DataLists for OrderCreateRQ
export function listPassengerIDs_booking(doc) {
  return listPassengerIDs(doc);
}

// Generic passenger ID lister for Seats/Services
export function listPassengerIDs_generic(doc) {
  return listPassengerIDs(doc);
}

// --- FOP extractor ---

export function mapFOP(doc) {
  const payments = findElementsByLocalName(doc, 'Payment');
  const fops = [];
  for (const payment of payments) {
    const typeEl = findFirstByLocalName(payment, 'Type');
    const typeVal = typeEl ? typeEl.textContent.trim() : '';

    if (typeVal === 'CA' || findFirstByLocalName(payment, 'Cash')) {
      fops.push('CASH');
    } else if (typeVal === 'CK' || findFirstByLocalName(payment, 'Check')) {
      fops.push('CHECK');
    } else if (typeVal === 'CC' || findFirstByLocalName(payment, 'CreditCard')) {
      const cc = findFirstByLocalName(payment, 'CreditCard');
      if (cc) {
        const code = cc.getAttribute('Code') || cc.getAttribute('CardCode') || '';
        fops.push(`CC${code}`);
      } else {
        fops.push('CC');
      }
    } else if (typeVal) {
      fops.push(typeVal);
    }
  }
  return fops.join(',') || '';
}

// --- Conditional "Y" extractors ---

export function conditionalY_OrderID(doc) {
  const orderIdEl = findFirstByLocalName(doc, 'OrderID');
  return orderIdEl ? 'Y' : '';
}

export function conditionalY_PNR(doc) {
  const pnrEl = findFirstByLocalName(doc, 'PNR');
  return pnrEl ? 'Y' : '';
}

export function conditionalY_AirlineRecLoc(doc) {
  const el = findFirstByLocalName(doc, 'AirlineRecLoc');
  return el ? 'Y' : '';
}

export function conditionalY_LongSell(doc) {
  const el = findFirstByLocalName(doc, 'LongSell');
  return el ? 'Y' : '';
}

// --- XPath-based simple value extraction ---

// Extract a value by a simple slash-separated path relative to the root element.
// Supports paths like "Party/Sender/TravelAgencySender/PseudoCity"
// and attribute access like "@Version" or "Query/Filters/OrderID/@Owner"
export function extractBySimplePath(doc, path) {
  if (!path) return '';
  const root = doc.documentElement;

  // Handle root-level attribute: "@Version"
  if (path.startsWith('@')) {
    return root.getAttribute(path.slice(1)) || '';
  }

  const parts = path.split('/');
  let current = root;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (part.startsWith('@')) {
      // Attribute of current element
      return current.getAttribute(part.slice(1)) || '';
    }

    // Find child element by local name
    const child = findFirstByLocalName(current, part);
    if (!child) return '';
    current = child;
  }

  return current.textContent.trim();
}

// --- Master extractor registry ---

export const EXTRACTORS = {
  combineODs,
  combineODs_2,
  combineODs_3,
  combineDates,
  combineDates_2,
  combineDates_3,
  depTimePreference,
  arrivalTimePreference,
  countByPTC,
  listPassengerIDs,
  listPassengerIDs_booking,
  listPassengerIDs_generic,
  mapFOP,
  conditionalY_OrderID,
  conditionalY_PNR,
  conditionalY_AirlineRecLoc,
  conditionalY_LongSell,
};
