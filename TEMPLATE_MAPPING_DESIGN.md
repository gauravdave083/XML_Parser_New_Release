# SSR INST XML Parser — Solution Document

## 1. Tool Overview

### 1.1 What Is This Tool?

The **SSR INST XML Parser** is a browser-based application that takes SOAP/XML requests used in airline NDC (New Distribution Capability) and FLX (Farelogix) test automation, parses them, and exports the extracted data into a **predefined Excel format** that exactly matches the `SSR_INST_Testcases_TCG.xlsx` data sheet structure.

### 1.2 The Problem It Solves

Today, QA engineers manually read XML requests and hand-type values into the Excel test data sheet — filling in columns like `Market`, `Travelers`, `PCC`, `FOP`, SSRs, contact details, etc. This is:

- **Slow**: A single test case with 6 request types can have 300+ fields to fill.
- **Error-prone**: Copy-paste mistakes, wrong columns, missed values.
- **Repetitive**: The same XML structure maps to the same columns every time.

This tool **automates** that process: paste XML → get the correctly populated Excel row.

### 1.3 Who Uses It?

- QA Engineers preparing test data sheets for SSR INST automation runs.
- Test Leads validating test case data before execution.
- Anyone creating or updating `SSR_INST_Testcases_TCG.xlsx`.

---

## 2. Source Excel Template

**File**: `C:\Projects_EK_EKD\SSR INST\SSR_INST_Testcases_TCG.xlsx`

### 2.1 Workbook Structure (26 Sheets)

The workbook contains **three categories** of sheets:

#### Category A: Request Data Sheets (parsed from XML)

These sheets hold test case parameters extracted from XML requests. Each follows a 3-row header pattern:

```
Row 0  →  Section group headers (merged cells, e.g., "Origin Destination Details")
Row 1  →  NDC column headers    (e.g., "Market", "Travelers", "FlightSelector")
Row 2  →  FLX column headers    (e.g., "Market", "FlightType", "BrandedFareSupport")
Row 3+  →  Test case data rows   (Col0 = TestCase_ID, remaining cols = values)
```

| Sheet Name              | NDC Request Type         | FLX Request Type               | Total Cols |
|-------------------------|--------------------------|--------------------------------|------------|
| **Test Cases Data**     | AirShoppingRQ            | AirAvailabilityRQ/FareSearchRQ | ~120       |
| **Pricing**             | OfferPriceRQ             | FlightPriceRQ                  | ~29        |
| **Seats**               | SeatAvailabilityRQ       | FLX SeatAvail                  | ~14        |
| **Booking**             | OrderCreateRQ            | PNRCreateRQ                    | ~78        |
| **Retrieve**            | OrderRetrieveRQ          | PNRRetrieveRQ                  | ~8         |
| **Services**            | ServiceListRQ            | FLX ServiceList                | ~25        |
| Exchange                | OrderReshopRQ (Exchange) | FLX Exchange                   | ~74        |
| ORDER-PNR-Modification  | OrderChangeRQ            | PNRChangeRQ                    | ~106       |
| Document Issuance       | TicketIssueRQ            | —                              | ~14        |
| Document Management     | TicketImage/Refund/Void  | —                              | ~7         |
| Reshop                  | OrderReshopRQ            | FLX Reshop                     | ~55        |
| OrderQuote              | OrderQuoteRQ             | —                              | ~6         |
| Rules                   | OrderRulesRQ             | —                              | ~8         |
| Cancel                  | OrderCancelRQ            | PNRCancelRQ                    | ~4         |
| Queues                  | QueueRQ                  | —                              | ~14        |
| Search Request          | OrderListRQ              | NameListRQ                     | ~26        |
| CMPP                    | FareQuoteRQ              | BaggageAllowanceRQ             | ~46        |

**Bold** = Core flow (Phase 1 implementation).

#### Category B: Lookup/Reference Sheets (copied as-is)

These sheets are NOT parsed from XML. They contain reference data that other sheets point to via IDs (e.g., `CID1`, `CCVI-1`, `AHXA`).

| Sheet Name          | Key Column     | Purpose                                         |
|---------------------|----------------|--------------------------------------------------|
| **PCC Details**     | PCC            | Agency config: credentials, POS, sale info       |
| **FOP Details**     | FOP_IDs        | Credit card numbers, billing address, 3DS info   |
| **ContactInfo**     | Contact_IDs    | Address, phone, email per contact                |
| **TravelerDetails** | Traveler_IDs   | Name, DOB, gender, passport, FF, APIS info       |
| Project Details     | —              | Environment config (host, port, trace IDs)       |

#### Category C: Metadata/Config Sheets (not exported)

| Sheet Name              | Purpose                              |
|-------------------------|--------------------------------------|
| customvalidationflxzen  | Custom AI validation prompts         |
| Comparison              | Response comparison config           |
| Zephyr TestCase Details | Jira/Zephyr integration metadata     |
| ScenariosSupported      | Reference: scenario keyword list     |

---

## 3. Application Architecture

### 3.1 Current State

```
┌──────────────────────────────────────────────────────────────┐
│  React App (Vite + React 19)                                 │
│                                                              │
│  App.jsx                                                     │
│  ├── requestTabs[]       (shared request tab definitions)    │
│  ├── testCases[]         (each TC holds XML per tab)         │
│  │                                                           │
│  ├── Header.jsx          (top nav bar)                       │
│  ├── Dashboard.jsx       (main workspace)                    │
│  │   ├── Sidebar         (test case list: add/rename/remove) │
│  │   ├── XmlBlock[]      (one per request tab — paste XML)   │
│  │   ├── MappingModal    (custom XPath-to-column rules)      │
│  │   └── PreviewModal    (preview extracted data as table)   │
│  ├── FileUpload.jsx      (bulk XML upload)                   │
│  │                                                           │
│  └── xmlParser.js        (parse XML, extract values, export) │
│      ├── parseXmlToNodes()                                   │
│      ├── extractValueByPath()                                │
│      ├── generatePreviewData()                               │
│      └── exportToExcel()                                     │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 New Architecture (with Template Export)

```
┌──────────────────────────────────────────────────────────────────────┐
│  React App                                                           │
│                                                                      │
│  App.jsx                                                             │
│  ├── requestTabs[]                                                   │
│  ├── testCases[]                                                     │
│  ├── exportMode: "NDC" | "FLX"    ← NEW: user-selectable            │
│  │                                                                   │
│  ├── Dashboard.jsx                                                   │
│  │   ├── Sidebar (test cases)                                        │
│  │   ├── XmlBlock[] (request tabs with XML)                          │
│  │   ├── ExportSettingsPanel        ← NEW                            │
│  │   │   ├── NDC / FLX mode toggle                                   │
│  │   │   └── Original Excel file picker (for lookup sheets)         │
│  │   ├── MappingModal                                                │
│  │   └── PreviewModal (now shows template-formatted output)          │
│  │                                                                   │
│  └── utils/                                                          │
│      ├── xmlParser.js               (existing: parse, extract)       │
│      ├── templateDefinitions.js     ← NEW: column-to-XPath maps     │
│      ├── templateExport.js          ← NEW: template-aware export     │
│      └── lookupSheetCopier.js       ← NEW: copy sheets from source  │
│                                                                      │
│  config/                                                             │
│      └── sheetTemplates/            ← NEW: per-sheet configs         │
│          ├── testCasesData.js                                        │
│          ├── pricing.js                                              │
│          ├── booking.js                                              │
│          ├── retrieve.js                                             │
│          ├── seats.js                                                │
│          └── services.js                                             │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 4. How Template Export Works

### 4.1 End-to-End Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 1: USER SETUP                                                     │
│                                                                         │
│  1a. User adds Test Cases in the sidebar: TC1, TC2, TC3, ...           │
│  1b. User pastes XML into request blocks for each test case:           │
│      - AirShoppingRQ XML → "AirShoppingRQ" tab                        │
│      - OfferPriceRQ XML  → "OfferPriceRQ" tab                         │
│      - OrderCreateRQ XML → "OrderCreateRQ" tab                        │
│      etc.                                                               │
│  1c. User selects export mode: NDC or FLX                              │
│  1d. User browses to original Excel for lookup sheets (optional)       │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 2: AUTO-DETECTION                                                 │
│                                                                         │
│  When XML is pasted, the tool:                                          │
│  - Reads the root element name (e.g., "AirShoppingRQ")                 │
│  - Looks up which Excel sheet this maps to (→ "Test Cases Data")       │
│  - Looks up the template definition for that sheet                     │
│  - Highlights which columns can be extracted from this XML             │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 3: EXTRACTION (on Preview or Export)                              │
│                                                                         │
│  For each sheet in the template:                                        │
│    For each test case:                                                  │
│      For each column defined in the template:                           │
│        → Extract value from XML using the mapped XPath                 │
│        → Apply any transformation rules (e.g., combine ODs into        │
│          "DXB-MCT,MCT-DXB" format for the Market column)              │
│        → Place value in the correct column position                    │
│                                                                         │
│  Result = one data row per test case per sheet                         │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 4: EXCEL GENERATION                                               │
│                                                                         │
│  Build workbook with:                                                   │
│  - Row 0: Section group headers (merged cells) — replicated exactly    │
│  - Row 1: NDC column headers                                           │
│  - Row 2: FLX column headers                                           │
│  - Row 3+: Test case data rows                                         │
│                                                                         │
│  + Lookup sheets (PCC Details, FOP Details, ContactInfo,               │
│    TravelerDetails) copied from the original Excel file                │
│                                                                         │
│  → Download as .xlsx                                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Request Type → Sheet Mapping

When the tool detects a root XML element, it maps it to the correct Excel sheet:

| XML Root Element      | Excel Sheet         | Notes                        |
|-----------------------|---------------------|------------------------------|
| `AirShoppingRQ`       | Test Cases Data     | Main shopping parameters     |
| `OfferPriceRQ`        | Pricing             | Offer pricing parameters     |
| `OrderCreateRQ`       | Booking             | Booking/order creation       |
| `OrderRetrieveRQ`     | Retrieve            | Order retrieval              |
| `SeatAvailabilityRQ`  | Seats               | Seat availability            |
| `ServiceListRQ`       | Services            | Ancillary services           |

### 4.3 NDC vs FLX Mode

The user selects **NDC** or **FLX** before export. This determines:

- **Which header row** is used as the "active" column set (Row 1 for NDC, Row 2 for FLX).
- **Which XPath mappings** are applied (NDC XML paths vs FLX XML paths).
- **Which columns are populated** (some columns exist only in NDC, some only in FLX).

Both Row 1 and Row 2 headers are always written to the output Excel (to maintain format compatibility), but data values are placed under the active mode's columns.

---

## 5. XPath Mapping Definitions

This is the core configuration — mapping each Excel column to the specific XPath in the XML request. Below are the complete mappings for Phase 1 sheets, derived from the sample XMLs provided.

### 5.1 Test Cases Data (AirShoppingRQ)

**Sample XML root**: `<AirShoppingRQ>`

| Col | NDC Header (Row 1)          | XPath in AirShoppingRQ                                                  | Transform              |
|-----|-----------------------------|-------------------------------------------------------------------------|------------------------|
| 0   | Active                      | — (user-provided, default "Y")                                         | Static "Y"             |
| 1   | TestCase_ID                 | — (from test case sidebar)                                              | TC ID                  |
| 7   | PCC                         | `Party/Sender/TravelAgencySender/PseudoCity`                            | Direct                 |
| 14  | Market                      | `CoreQuery/OriginDestinations/OriginDestination[*]/Departure/AirportCode` + `Arrival/AirportCode` | Combine: "DXB-MCT,MCT-DXB" |
| 15  | Market2                     | `CoreQuery/OriginDestinations/OriginDestination[3]` (if exists)         | Same combine pattern   |
| 19  | Travel_Dates                | `CoreQuery/OriginDestinations/OriginDestination[*]/Departure/Date`      | Combine: "2026-04-08,2026-04-28" |
| 26  | Travelers                   | `DataLists/PassengerList/Passenger[*]/PTC`                              | Count+PTC: "2ADT,1CNN,1INF" |
| 27  | Traveler_IDs                | `DataLists/PassengerList/Passenger[*]/@PassengerID`                     | Combine: "T1,T2,T3,T1.1" |

**Traveler-related sub-extraction** (feeds into TravelerDetails lookup sheet):

| TravelerDetails Col | XPath per Passenger                                          |
|---------------------|--------------------------------------------------------------|
| Traveler_IDs        | `Passenger/@PassengerID`                                     |
| FirstName           | `Individual/GivenName`                                       |
| LastName            | `Individual/Surname`                                         |
| PTC                 | `PTC`                                                        |
| FFNumber            | `LoyaltyProgramAccount/AccountNumber`                        |
| FFCompanyCode       | `LoyaltyProgramAccount/Airline/AirlineDesignator`            |

### 5.2 Pricing (OfferPriceRQ)

**Sample XML root**: `<OfferPriceRQ>`

| Col | NDC Header (Row 1)                       | XPath in OfferPriceRQ                                      | Transform     |
|-----|------------------------------------------|-------------------------------------------------------------|---------------|
| 0   | TestCase_ID                              | — (from test case sidebar)                                   | TC ID         |
| —   | (PCC)                                    | `Party/Sender/TravelAgencySender/PseudoCity`                 | Direct        |
| —   | Offer/OfferID                            | `Query/Offer/@OfferID`                                       | Direct        |
| —   | Offer/Owner                              | `Query/Offer/@Owner`                                         | Direct        |
| —   | ResponseID                               | `Query/Offer/@ResponseID`                                    | Direct        |
| —   | PassengerRefs                            | `Query/Offer/OfferItem/PassengerRefs`                        | Direct        |

*Note: Most Pricing columns (like `LongSell`, `FareType`, `BestPricing_Preference`, qualifiers) are optional parameters that may or may not be in the XML. The tool extracts what's present and leaves blank what isn't.*

### 5.3 Booking (OrderCreateRQ)

**Sample XML root**: `<OrderCreateRQ>`

| Col | NDC Header (Row 1)                | XPath in OrderCreateRQ                                           | Transform                   |
|-----|------------------------------------|------------------------------------------------------------------|-----------------------------|
| 0   | TestCase_ID                        | — (from test case sidebar)                                        | TC ID                       |
| 3   | OrderCreate_FOP                    | `Query/Payments/Payment/Type` or `Method/Cash` or `Method/CreditCard` | Map: "CA"→"CASH", "CC..."→FOP ID |
| 17  | OrderCreate_Traveler_IDs           | `Query/DataLists/PassengerList/Passenger[*]/@PassengerID`         | Combine: "T1"               |

**Passenger sub-extraction** (feeds into TravelerDetails):

| TravelerDetails Col             | XPath per Passenger                                    |
|---------------------------------|--------------------------------------------------------|
| Traveler_IDs                    | `Passenger/@PassengerID`                               |
| Title                           | `Individual/NameTitle`                                 |
| FirstName                       | `Individual/GivenName`                                 |
| MiddleName                      | `Individual/MiddleName`                                |
| LastName                        | `Individual/Surname`                                   |
| PTC                             | `PTC`                                                  |
| DateOfBirth                     | `Individual/Birthdate`                                 |
| Gender                          | `Individual/Gender`                                    |
| CitizenshipCountryCode_Pax      | `CitizenshipCountryCode`                               |
| Contact_IDs                     | `ContactInfoRef`                                       |

**Contact sub-extraction** (feeds into ContactInfo):

| ContactInfo Col          | XPath per ContactInformation                           |
|--------------------------|--------------------------------------------------------|
| Contact_IDs              | `ContactInformation/@ContactID`                        |
| Email_ID                 | `ContactProvided/EmailAddress/EmailAddressValue`       |
| AreaCode_PhoneNumber     | `ContactProvided/Phone/AreaCode`                       |
| PhoneNumber              | `ContactProvided/Phone/PhoneNumber`                    |
| PhoneLabel               | `ContactProvided/Phone/Label`                          |
| CountryDialingCode       | `ContactProvided/Phone/CountryDialingCode`             |

### 5.4 Retrieve (OrderRetrieveRQ)

**Sample XML root**: `<OrderRetrieveRQ>`

| Col | NDC Header (Row 1)                    | XPath in OrderRetrieveRQ                                | Transform           |
|-----|----------------------------------------|----------------------------------------------------------|----------------------|
| 0   | TestCase_ID                            | — (from test case sidebar)                                | TC ID                |
| 1   | OrderRetrieve_Owner                    | `Query/Filters/OrderID/@Owner`                            | Direct               |
| 2   | OrderRetrieve_OrderID_RecLoc           | `Query/Filters/OrderID` (text content)                    | Direct               |
| 3   | OrderRetrieve_OrderID                  | — (set to "Y" if OrderID is present)                      | Conditional "Y"      |
| 4   | OrderRetrieve_PNR                      | `Query/Filters/PNR` (if present)                          | Conditional "Y"      |
| 5   | OrderRetrieve_Airline_RecLoc           | `Query/Filters/AirlineRecLoc` (if present)                | Conditional "Y"      |

### 5.5 Seats (SeatAvailabilityRQ)

| Col | NDC Header (Row 1)                    | XPath in SeatAvailabilityRQ                              | Transform           |
|-----|----------------------------------------|----------------------------------------------------------|----------------------|
| 0   | TestCase_ID                            | — (from test case sidebar)                                | TC ID                |
| 1   | SeatAvailability_LongSell              | (if LongSell node present) → "Y"                         | Conditional          |
| 2   | Seats_FareBasisCode                    | `FareBasisCode`                                           | Direct               |
| 3   | PreSeatSelector                        | Seat selection identifiers (pre-booking)                  | Direct               |
| 4   | PostSeatSelector                       | Seat selection identifiers (post-booking)                 | Direct               |
| 5   | Seats_FOP                              | `Payment/Type` + card details                             | FOP ID               |
| 7   | SeatAvailability_Traveler_IDs          | `PassengerList/Passenger[*]/@PassengerID`                 | Combine              |

### 5.6 Services (ServiceListRQ)

| Col | NDC Header (Row 1)                    | XPath in ServiceListRQ                                   | Transform           |
|-----|----------------------------------------|----------------------------------------------------------|----------------------|
| 0   | TestCase_ID                            | — (from test case sidebar)                                | TC ID                |
| 1   | ServiceList_LongSell                   | (if LongSell present) → "Y"                              | Conditional          |
| 2   | PreServiceSelector                     | Pre-booking service codes                                 | Direct               |
| 4   | PostServiceSelector                    | Post-booking service codes                                | Direct               |
| 9   | ServiceFilter_GroupCode                | `ServiceFilter/GroupCode`                                 | Direct               |
| 10  | Services_FOP                           | `Payment/Type` + card details                             | FOP ID               |
| 13  | ServiceList_Traveler_IDs               | `PassengerList/Passenger[*]/@PassengerID`                 | Combine              |

---

## 6. Value Transformations

Some Excel columns don't hold raw XML values — they require transformation logic.

### 6.1 Market Column (Combine ODs)

**Input XML**:
```xml
<OriginDestination OriginDestinationKey="OD1">
  <Departure><AirportCode>DXB</AirportCode></Departure>
  <Arrival><AirportCode>MCT</AirportCode></Arrival>
</OriginDestination>
<OriginDestination OriginDestinationKey="OD2">
  <Departure><AirportCode>MCT</AirportCode></Departure>
  <Arrival><AirportCode>DXB</AirportCode></Arrival>
</OriginDestination>
```

**Output value**: `DXB-MCT,MCT-DXB`

**Logic**: For each `OriginDestination`, join `Departure/AirportCode` + `-` + `Arrival/AirportCode`, then comma-separate all ODs.

### 6.2 Travel Dates Column (Combine dates)

**Input**: Multiple `OriginDestination[*]/Departure/Date` values.

**Output**: `2026-04-08,2026-04-28`

### 6.3 Travelers Column (Count by PTC)

**Input XML**:
```xml
<Passenger PassengerID="T1"><PTC>ADT</PTC></Passenger>
<Passenger PassengerID="T2"><PTC>ADT</PTC></Passenger>
<Passenger PassengerID="T3"><PTC>CNN</PTC></Passenger>
<Passenger PassengerID="T1.1"><PTC>INF</PTC></Passenger>
```

**Output**: `2ADT,1CNN,1INF`

**Logic**: Group passengers by PTC, count each group, format as `{count}{PTC}`, comma-separate.

### 6.4 FOP Mapping

**Input XML**:
```xml
<Payment>
  <Type>CA</Type>
  <Method><Cash CashInd="true"/></Method>
</Payment>
```

**Output**: `CASH`

**Mapping rules**:
- `Type=CA` + `Cash` → `CASH`
- `Type=CC` + `CreditCard/@Code=VI` → `CCVI-{FOP_IDs ref}`
- `Type=CC` + `CreditCard/@Code=CA` → `CCCA-{FOP_IDs ref}`
- `Type=CK` → `CHECK`

### 6.5 Conditional "Y" Flags

Some columns expect just `"Y"` if a certain node exists:
- `OrderRetrieve_OrderID` = `"Y"` if `Query/Filters/OrderID` is present
- `OrderRetrieve_PNR` = `"Y"` if `Query/Filters/PNR` is present
- `LongSell` = `"Y"` if LongSell node exists in the XML

---

## 7. Lookup Sheet Handling

### 7.1 Strategy: Copy from Original Excel

The lookup sheets (PCC Details, FOP Details, ContactInfo, TravelerDetails) are **not parsed from XML**. Instead:

1. **At export time**, the user optionally provides a path to the original `SSR_INST_Testcases_TCG.xlsx`.
2. The tool reads the lookup sheets from that file using SheetJS (`xlsx` library).
3. The lookup sheets are copied **as-is** into the exported workbook.
4. If no source file is provided, empty lookup sheets with just headers are created.

### 7.2 Special Case: OrderCreateRQ → TravelerDetails + ContactInfo

When an `OrderCreateRQ` is parsed, the XML contains full passenger and contact details. The tool can **optionally** extract these and populate new rows in TravelerDetails and ContactInfo sheets, in addition to copying existing data from the source file.

```
OrderCreateRQ XML
  └── DataLists/PassengerList/Passenger[*]
      ├── Individual (Name, DOB, Gender)
      ├── PTC
      ├── CitizenshipCountryCode
      └── ContactInfoRef → links to ContactList/ContactInformation
                            ├── EmailAddress
                            └── Phone
```

This cross-sheet extraction is a **Phase 2** enhancement.

---

## 8. UI Design

### 8.1 Current Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  HEADER                                                          │
├──────────┬───────────────────────────────────────────────────────┤
│ SIDEBAR  │  MAIN AREA                                            │
│          │                                                       │
│ TC-001 ◄ │  ┌─────────────────────────────────────────────────┐  │
│ TC-002   │  │  XmlBlock: AirShoppingRQ                        │  │
│ TC-003   │  │  [paste XML here]                               │  │
│          │  └─────────────────────────────────────────────────┘  │
│ + Add TC │  ┌─────────────────────────────────────────────────┐  │
│          │  │  XmlBlock: OrderCreateRQ                        │  │
│          │  │  [paste XML here]                               │  │
│          │  └─────────────────────────────────────────────────┘  │
│          │                                                       │
│          │  [+ Add Request Block]                                │
│          │                                                       │
│          │  ┌─────────────────────────────────────────────────┐  │
│          │  │  [Mapping Rules] [Preview] [Parse & Export]     │  │
│          │  └─────────────────────────────────────────────────┘  │
├──────────┴───────────────────────────────────────────────────────┤
```

### 8.2 New UI Elements

#### Export Settings Panel (above action bar)

```
┌─────────────────────────────────────────────────────────────────┐
│  EXPORT SETTINGS                                                 │
│                                                                  │
│  Export Mode:   (●) NDC    ( ) FLX                              │
│                                                                  │
│  Source Excel:  [Browse...] SSR_INST_Testcases_TCG.xlsx         │
│  (for copying lookup sheets: PCC, FOP, ContactInfo, Travelers)  │
│                                                                  │
│  Export Format: (●) Template Format    ( ) Raw (current)        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

- **Export Mode toggle**: Switches between NDC (Row 1) and FLX (Row 2) column headers.
- **Source Excel picker**: User browses to the original `.xlsx` file to copy lookup sheets from.
- **Export Format toggle**: Choose between template-formatted output (predefined columns) vs raw auto-extract (current behavior).

#### Preview Modal Enhancement

The preview modal now shows:
- **Tab per sheet** (Test Cases Data, Pricing, Booking, etc.)
- **3-row header** exactly matching the Excel: Row 0 (section), Row 1 (NDC), Row 2 (FLX)
- **Highlighted active mode** (NDC row highlighted in blue, FLX in green)
- **Data rows** below with extracted values

---

## 9. Template Definition Data Structure

Each sheet template is defined as a JavaScript object:

```javascript
// Example: config/sheetTemplates/testCasesData.js

export const TEST_CASES_DATA_TEMPLATE = {
  sheetName: "Test Cases Data",
  detectByRootElement: "AirShoppingRQ",    // auto-detect from XML
  
  // Row 0: Section group headers (col index → text)
  sectionHeaders: {
    12: "Redemption Booking",
    14: "Origin Destination Details",
    26: "Travelers Information",
    30: "Flight Selection",
    35: "Preferences / Filters",
    56: "Fare Options",
    58: "Qualifiers",
    // ... etc
  },
  
  // Row 0: Merged cell ranges [startCol, endCol]
  sectionMerges: [
    [12, 13], [14, 25], [26, 29], [30, 33], [35, 55], [56, 57], [58, 65],
  ],
  
  // Columns: NDC definition (Row 1)
  ndcColumns: [
    { col: 0,  header: "Active",               xpath: null, defaultValue: "Y" },
    { col: 1,  header: "TestCase_ID",           xpath: null, source: "testCaseId" },
    { col: 2,  header: "Functional_Area",       xpath: null, defaultValue: "NDC" },
    { col: 3,  header: "Scenario",              xpath: null, source: "userInput" },
    { col: 7,  header: "PCC",                   xpath: "Party/Sender/TravelAgencySender/PseudoCity" },
    { col: 14, header: "Market",                xpath: null, extractor: "combineODs" },
    { col: 19, header: "Travel_Dates",          xpath: null, extractor: "combineDates" },
    { col: 26, header: "Travelers",             xpath: null, extractor: "countByPTC" },
    { col: 27, header: "Traveler_IDs",          xpath: null, extractor: "listPassengerIDs" },
    // ... all 120 columns
  ],
  
  // Columns: FLX definition (Row 2) — different xpaths/headers for some cols
  flxColumns: [
    { col: 0,  header: "Active",               xpath: null, defaultValue: "Y" },
    { col: 1,  header: "TestCase_ID",           xpath: null, source: "testCaseId" },
    { col: 2,  header: "Functional_Area",       xpath: null, defaultValue: "FLX" },
    { col: 7,  header: "PCC",                   xpath: "Party/Sender/TravelAgencySender/PseudoCity" },
    { col: 13, header: "CMPP_Flow",             xpath: null, source: "userInput" },
    { col: 14, header: "Market",                xpath: null, extractor: "combineODs" },
    // ... FLX-specific columns
  ],
};
```

### 9.1 Column Definition Fields

| Field          | Type     | Description                                                   |
|----------------|----------|---------------------------------------------------------------|
| `col`          | number   | 0-based column index in the Excel sheet                       |
| `header`       | string   | Column header text (exactly as in the original Excel)         |
| `xpath`        | string   | Simple XPath relative to the request root element             |
| `extractor`    | string   | Named transformation function (e.g., "combineODs")           |
| `defaultValue` | string   | Static value to always place in this column                   |
| `source`       | string   | Where value comes from: "testCaseId", "userInput", etc.      |

### 9.2 Named Extractors

```javascript
const EXTRACTORS = {
  combineODs: (xmlDoc) => {
    // Extract all OriginDestination nodes
    // Return "DXB-MCT,MCT-DXB"
  },
  
  combineDates: (xmlDoc) => {
    // Extract departure dates from all ODs
    // Return "2026-04-08,2026-04-28"
  },
  
  countByPTC: (xmlDoc) => {
    // Count passengers by PTC type
    // Return "2ADT,1CNN,1INF"
  },
  
  listPassengerIDs: (xmlDoc) => {
    // List all PassengerID attributes
    // Return "T1,T2,T3,T1.1"
  },
  
  mapFOP: (xmlDoc) => {
    // Map Payment/Type + Method to FOP string
    // Return "CASH" or "CCVI-1"
  },
};
```

---

## 10. Excel Output Format

The exported Excel file replicates the original template exactly:

### 10.1 Per Data Sheet

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Row 0: │ [merged]"OD Details"  │ [merged]"Travelers" │ [merged]"Prefs" │
│ Row 1: │ Active│TC_ID│PCC│Market│Travel│...│Travelers│Traveler_IDs│... │  ← NDC
│ Row 2: │ Active│TC_ID│PCC│Market│Travel│...│Travelers│Traveler_IDs│... │  ← FLX
│ Row 3: │  Y   │ TC1 │E656│DXB-MCT,MCT-DXB│2026-04-08│...│2ADT,1CNN│...│
│ Row 4: │  Y   │ TC2 │EH96│...  │...   │...│1ADT     │...│...│...│...  │
│ Row 5: │  Y   │ TC3 │...                                               │
└─────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Lookup Sheets (copied as-is)

```
Sheet "PCC Details"      → exact copy from source Excel
Sheet "FOP Details"      → exact copy from source Excel
Sheet "ContactInfo"      → exact copy from source Excel
Sheet "TravelerDetails"  → exact copy from source Excel
```

### 10.3 Sheet Order in Output

Matches the original workbook order:
1. Test Cases Data
2. Pricing
3. Seats
4. Booking
5. Retrieve
6. Services
7. ContactInfo
8. TravelerDetails
9. PCC Details
10. FOP Details

---

## 11. Implementation Plan

### Phase 1: Core Template Export (6 sheets)

| Step | Task                                             | Files                                  |
|------|--------------------------------------------------|----------------------------------------|
| 1    | Create template definitions for 6 core sheets   | `config/sheetTemplates/*.js`           |
| 2    | Build named extractors (combineODs, countPTC...) | `utils/extractors.js`                  |
| 3    | Build template-aware export engine               | `utils/templateExport.js`              |
| 4    | Add NDC/FLX mode toggle to UI                    | `Dashboard.jsx`, `App.jsx`            |
| 5    | Add source Excel file picker for lookup sheets   | `Dashboard.jsx`, `ExportSettings.jsx` |
| 6    | Implement lookup sheet copier                    | `utils/lookupSheetCopier.js`           |
| 7    | Update PreviewModal for template-formatted view  | `PreviewModal.jsx`                    |
| 8    | Wire everything: Preview + Export buttons        | `Dashboard.jsx`, `xmlParser.js`       |
| 9    | Test with sample XMLs provided                   | Manual testing                         |

### Phase 2: Cross-Sheet Extraction

| Step | Task                                             |
|------|--------------------------------------------------|
| 1    | Extract TravelerDetails from OrderCreateRQ XML   |
| 2    | Extract ContactInfo from OrderCreateRQ XML       |
| 3    | Auto-populate lookup sheets from parsed XML      |

### Phase 3: Remaining Sheets

| Step | Task                                             |
|------|--------------------------------------------------|
| 1    | Add template definitions for Exchange, Modification, Document Issuance, etc. |
| 2    | Support all 18 request data sheets               |

### Phase 4: Advanced Features

| Step | Task                                             |
|------|--------------------------------------------------|
| 1    | Template Editor UI (edit column-XPath mappings)  |
| 2    | Auto-suggest XPaths when XML is pasted           |
| 3    | Validation warnings (missing required columns)   |
| 4    | Import existing data rows from source Excel      |

---

## 12. Technology Stack

| Component          | Technology                    | Purpose                          |
|--------------------|-------------------------------|----------------------------------|
| Frontend framework | React 19 + Vite               | UI rendering                     |
| Styling            | CSS (custom)                  | Layout and theming               |
| Icons              | Lucide React                  | UI icons                         |
| XML Parsing        | Browser DOMParser             | Parse XML strings                |
| Excel Read/Write   | SheetJS (xlsx)                | Read source Excel, write output  |
| Routing            | React Router DOM              | Page navigation                  |
| State management   | React useState/useEffect      | Local component state            |

---

## 13. File Structure (After Implementation)

```
src/
├── App.jsx
├── main.jsx
├── index.css
├── components/
│   ├── Header.jsx
│   ├── XmlBlock.jsx
│   ├── MappingModal.jsx
│   ├── PreviewModal.jsx
│   └── ExportSettings.jsx           ← NEW
├── pages/
│   ├── Dashboard.jsx
│   ├── Dashboard.css
│   └── FileUpload.jsx
├── utils/
│   ├── xmlParser.js                 (existing: parse, validate)
│   ├── templateExport.js            ← NEW: template-driven export
│   ├── extractors.js                ← NEW: named value extractors
│   └── lookupSheetCopier.js         ← NEW: copy sheets from source
└── config/
    └── sheetTemplates/              ← NEW: template definitions
        ├── index.js                 (registry of all templates)
        ├── testCasesData.js         (AirShoppingRQ → Test Cases Data)
        ├── pricing.js               (OfferPriceRQ → Pricing)
        ├── booking.js               (OrderCreateRQ → Booking)
        ├── retrieve.js              (OrderRetrieveRQ → Retrieve)
        ├── seats.js                 (SeatAvailabilityRQ → Seats)
        └── services.js              (ServiceListRQ → Services)
```

---

## 14. Summary

| Aspect               | Detail                                                           |
|----------------------|------------------------------------------------------------------|
| **What it does**     | Parses NDC/FLX XML requests and exports to predefined Excel format |
| **Excel format**     | Exact replica of `SSR_INST_Testcases_TCG.xlsx`                   |
| **Sheets (Phase 1)** | Test Cases Data, Pricing, Seats, Booking, Retrieve, Services     |
| **Lookup handling**  | Copied as-is from original Excel                                 |
| **NDC/FLX**          | User chooses per export                                          |
| **Row 0 headers**    | Replicated with merged cells                                     |
| **Transformations**  | Market combining, PTC counting, FOP mapping, conditional flags   |
| **Tech stack**       | React 19 + Vite + SheetJS + Browser DOMParser                   |
