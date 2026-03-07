/**
 * Mock user directory for Joy-Per's Hub
 * Roles: admin | manager | employee
 * PIN: 4-digit string used for quick kiosk clock-in
 * password: used for mobile login
 */
export const MOCK_USERS = [
  // ── ADMIN ────────────────────────────────────────────────
  {
    id: "u000",
    name: "jonp",
    firstName: "Jon",
    role: "admin",
    department: "Management",
    title: "Owner",
    pin: "0944",
    password: "Joy944",
    avatar: null,
    hireDate: "2008-01-01",
    birthday: null,
    anniversary: "2008-01-01",
    email: "jon@joypers.com",
    tags: [],
  },
  {
    id: "u001",
    name: "Diana Voss",
    firstName: "Diana",
    role: "admin",
    department: "Management",
    title: "General Manager",
    pin: "1000",
    password: "admin123",
    avatar: null, // placeholder for camera photo
    hireDate: "2010-03-15",
    birthday: "1978-07-22",
    anniversary: "2010-03-15",
    email: "d.voss@joypers.com",
    tags: [],
  },

  // ── MANAGERS ─────────────────────────────────────────────
  {
    id: "u002",
    name: "Marcus Reid",
    firstName: "Marcus",
    role: "manager",
    department: "Sales Floor",
    title: "Sales Manager",
    pin: "2001",
    password: "manager123",
    avatar: null,
    hireDate: "2015-06-01",
    birthday: "1985-11-03",
    anniversary: "2015-06-01",
    email: "m.reid@joypers.com",
    tags: [],
  },
  {
    id: "u003",
    name: "Sophie Tran",
    firstName: "Sophie",
    role: "manager",
    department: "Inventory",
    title: "Stock & Inventory Manager",
    pin: "2002",
    password: "manager456",
    avatar: null,
    hireDate: "2018-02-12",
    birthday: "1990-04-18",
    anniversary: "2018-02-12",
    email: "s.tran@joypers.com",
    tags: ["Remote"],
  },

  // ── EMPLOYEES ─────────────────────────────────────────────
  {
    id: "u004",
    name: "Jordan Blake",
    firstName: "Jordan",
    role: "employee",
    department: "Sales Floor",
    title: "Senior Sales Associate",
    pin: "3001",
    password: "emp123",
    avatar: null,
    hireDate: "2019-09-10",
    birthday: "1995-01-14",
    anniversary: "2019-09-10",
    email: "j.blake@joypers.com",
    tags: [],
  },
  {
    id: "u005",
    name: "Priya Nair",
    firstName: "Priya",
    role: "employee",
    department: "Sales Floor",
    title: "Sales Associate",
    pin: "3002",
    password: "emp456",
    avatar: null,
    hireDate: "2021-04-05",
    birthday: "1998-09-27",
    anniversary: "2021-04-05",
    email: "p.nair@joypers.com",
    tags: [],
  },
  {
    id: "u006",
    name: "Devon Carter",
    firstName: "Devon",
    role: "employee",
    department: "Sales Floor",
    title: "Sales Associate",
    pin: "3003",
    password: "emp789",
    avatar: null,
    hireDate: "2022-11-01",
    birthday: "1999-03-05",
    anniversary: "2022-11-01",
    email: "d.carter@joypers.com",
    tags: [],
  },
  {
    id: "u007",
    name: "Aisha Monroe",
    firstName: "Aisha",
    role: "employee",
    department: "Inventory",
    title: "Stock Associate",
    pin: "3004",
    password: "emp321",
    avatar: null,
    hireDate: "2023-02-20",
    birthday: "2001-06-15",
    anniversary: "2023-02-20",
    email: "a.monroe@joypers.com",
    tags: [],
  },
  {
    id: "u008",
    name: "Tyler Huang",
    firstName: "Tyler",
    role: "employee",
    department: "Sales Floor",
    title: "Part-Time Associate",
    pin: "3005",
    password: "emp654",
    avatar: null,
    hireDate: "2024-08-12",
    birthday: "2003-12-01",
    anniversary: "2024-08-12",
    email: "t.huang@joypers.com",
    tags: [],
  },
];

/**
 * Lookup helpers
 */
export const findUserByPin = (pin) =>
  MOCK_USERS.find((u) => u.pin === pin) || null;

export const findUserByCredentials = (name, password) =>
  MOCK_USERS.find(
    (u) =>
      u.name.toLowerCase() === name.toLowerCase() && u.password === password
  ) || null;

export const getUserById = (id) => MOCK_USERS.find((u) => u.id === id) || null;

/**
 * Update a user's data in the MOCK_USERS array in-place.
 * This keeps login data (PIN, password) in sync when changed from Profile.
 */
export const updateUserData = (userId, fields) => {
  const idx = MOCK_USERS.findIndex((u) => u.id === userId);
  if (idx !== -1) {
    Object.assign(MOCK_USERS[idx], fields);
  }
};
