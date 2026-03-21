// Template definition for "Seats" sheet — maps SeatAvailabilityRQ XML to Excel columns

export const SEATS_TEMPLATE = {
  sheetName: 'Seats',
  detectByRootElement: 'SeatAvailabilityRQ',

  sectionHeaders: {
    3: 'Pre Booking Seat Selector',
    4: 'Post Booking Seat Selector',
    5: 'Seats specifc FOP',
    7: 'Travelers Information',
    10: 'EMDIssue Seats Specific FOP for FLX workflows',
  },

  sectionMerges: [
    [3, 3], [4, 4], [5, 6], [7, 9], [10, 13],
  ],

  ndcColumns: [
    { col: 0, header: 'TestCase_ID', xpath: null, source: 'testCaseId' },
    { col: 1, header: 'SeatAvailability_LongSell', xpath: null, extractor: 'conditionalY_LongSell' },
    { col: 2, header: 'Seats_FareBasisCode', xpath: null },
    { col: 3, header: 'PreSeatSelector', xpath: null, source: 'userInput' },
    { col: 4, header: 'PostSeatSelector', xpath: null, source: 'userInput' },
    { col: 5, header: 'Seats_FOP', xpath: null },
    { col: 6, header: 'PaymentCardQualifiers_Seats', xpath: null },
    { col: 7, header: 'SeatAvailability_Traveler_IDs', xpath: null, extractor: 'listPassengerIDs_generic' },
    { col: 8, header: 'Seats_CorporateParticipant_ID', xpath: null },
    { col: 9, header: 'NA', xpath: null },
    { col: 10, header: 'NA', xpath: null },
    { col: 11, header: 'NA', xpath: null },
    { col: 12, header: 'NA', xpath: null },
    { col: 13, header: 'NA', xpath: null },
  ],

  flxColumns: [
    { col: 0, header: 'TestCase_ID', xpath: null, source: 'testCaseId' },
    { col: 1, header: 'NA', xpath: null },
    { col: 2, header: 'NA', xpath: null },
    { col: 3, header: 'FLX_PreSeatSelector', xpath: null, source: 'userInput' },
    { col: 4, header: 'FLX_PostSeatSelector', xpath: null, source: 'userInput' },
    { col: 5, header: 'NA', xpath: null },
    { col: 6, header: 'NA', xpath: null },
    { col: 7, header: 'NA', xpath: null },
    { col: 8, header: 'NA', xpath: null },
    { col: 9, header: 'PrivateFares_Corporate_Account', xpath: null },
    { col: 10, header: 'Pre_Seats_EMDIssue_FOP', xpath: null },
    { col: 11, header: 'Pre_Seats_EMDIssue_Multiple_FOP', xpath: null },
    { col: 12, header: 'Post_Seats_EMDIssue_FOP', xpath: null },
    { col: 13, header: 'Post_Seats_EMDIssue_Multiple_FOP', xpath: null },
  ],
};
