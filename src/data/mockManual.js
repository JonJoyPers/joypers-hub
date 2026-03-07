/**
 * Mock manual sections for Joy-Per's Store Manual
 * Each section has a version that bumps on update.
 * updatedBy references a user id from mockUsers.
 */
export const MANUAL_SECTIONS = [
  {
    id: "ms001",
    title: "Opening Procedures",
    body: "Arrive 15 minutes before the scheduled store opening. Disarm the alarm system using your assigned code. Turn on all showroom lights and check that display fixtures are powered. Boot up the POS terminals and verify the cash drawer float matches the closing count from the previous night. Unlock the front entrance exactly at opening time. Greet every customer within 10 seconds of entry.",
    updatedAt: "2026-02-10T09:00:00Z",
    updatedBy: "u000",
    version: 1,
  },
  {
    id: "ms002",
    title: "Closing Procedures",
    body: "Begin closing duties 15 minutes before the posted closing time. Politely inform browsing customers that the store will be closing soon. Run the end-of-day report on each POS terminal and reconcile the cash drawer. Secure all high-value inventory in the back room safe. Turn off display fixtures and showroom lights in order (back to front). Set the alarm system and lock all entrances. Submit the nightly closing report via the hub before leaving.",
    updatedAt: "2026-02-08T17:00:00Z",
    updatedBy: "u000",
    version: 1,
  },
  {
    id: "ms003",
    title: "Returns & Exchanges",
    body: "All returns must be processed within 30 days of purchase with original receipt. Items must be in original packaging and unworn condition. Use the POS 'Return' function and scan the receipt barcode. Exchanges follow the same policy but do not require manager approval under $200. Refunds over $200 require manager override. Defective items may be returned up to 90 days with proof of purchase. Always offer an exchange before a refund.",
    updatedAt: "2026-02-05T12:00:00Z",
    updatedBy: "u001",
    version: 1,
  },
  {
    id: "ms004",
    title: "Dress Code",
    body: "All team members must wear Joy-Per's branded polo or approved solid-color collared shirt. Bottoms should be khaki, black, or navy slacks or chinos — no jeans, shorts, or athletic wear. Closed-toe shoes are required on the sales floor at all times. Name badges must be visible and worn above the waist. Hair should be neat and pulled back if longer than shoulder length when working near machinery or inventory. Tattoos and piercings are permitted as long as they are not offensive.",
    updatedAt: "2026-01-20T10:00:00Z",
    updatedBy: "u001",
    version: 1,
  },
  {
    id: "ms005",
    title: "Workplace Safety",
    body: "Report any spills, broken fixtures, or safety hazards immediately to a manager. Use proper lifting technique (bend at knees, keep back straight) for boxes over 20 lbs. The first-aid kit is located behind the service counter. Fire extinguishers are mounted near each exit — familiarize yourself with locations. In case of emergency, follow the posted evacuation route to the parking lot assembly point. All incidents must be documented in the Incident Log within 24 hours.",
    updatedAt: "2026-02-12T08:30:00Z",
    updatedBy: "u000",
    version: 1,
  },
];
