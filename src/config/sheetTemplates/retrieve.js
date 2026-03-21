// Template definition for "Retrieve" sheet — maps OrderRetrieveRQ XML to Excel columns

export const RETRIEVE_TEMPLATE = {
  sheetName: 'Retrieve',
  detectByRootElement: 'OrderRetrieveRQ',

  sectionHeaders: {
    1: 'Provide Existing OrderID/F1 PNR/AirlineRecLoc',
    3: 'Provide the value as Y through which you want to perform a Retrieve',
  },

  sectionMerges: [
    [1, 2], [3, 7],
  ],

  ndcColumns: [
    { col: 0, header: 'TestCase_ID', xpath: null, source: 'testCaseId' },
    { col: 1, header: 'OrderRetrieve_Owner', xpath: 'Query/Filters/OrderID/@Owner' },
    { col: 2, header: 'OrderRetrieve_OrderID_RecLoc', xpath: 'Query/Filters/OrderID' },
    { col: 3, header: 'OrderRetrieve_OrderID', xpath: null, extractor: 'conditionalY_OrderID' },
    { col: 4, header: 'OrderRetrieve_PNR', xpath: null, extractor: 'conditionalY_PNR' },
    { col: 5, header: 'OrderRetrieve_Airline_RecLoc', xpath: null, extractor: 'conditionalY_AirlineRecLoc' },
    { col: 6, header: 'TestCase_Reference', xpath: null, source: 'userInput' },
    { col: 7, header: 'Use_ChildOrderID', xpath: null },
  ],

  flxColumns: [
    { col: 0, header: 'TestCase_ID', xpath: null, source: 'testCaseId' },
    { col: 1, header: 'PNRRetrieve_PNRDisplay_Source', xpath: null },
    { col: 2, header: 'PNRRetrieve_PNRDisplay_RecLoc', xpath: 'Query/Filters/OrderID' },
    { col: 3, header: 'NA', xpath: null },
    { col: 4, header: 'PNRRetrieve_PNRDisplay_PNR', xpath: null, extractor: 'conditionalY_PNR' },
    { col: 5, header: 'PNRRetrieve__PNRDisplay_Airline_RecLoc', xpath: null, extractor: 'conditionalY_AirlineRecLoc' },
    { col: 6, header: 'TestCase_Reference', xpath: null, source: 'userInput' },
    { col: 7, header: 'NA', xpath: null },
  ],
};
