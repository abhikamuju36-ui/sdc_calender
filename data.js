// Seed data for SDC Calendar
// Holidays sourced from official SDC 2026 Holiday & Pay Calendar

// Fixed-date SDC Paid Holidays (same date every year)
const FIXED_HOLIDAYS = [
  { m: 1,  d: 1,  name: "New Year's Day",   kind: 'federal' },
  { m: 12, d: 24, name: 'Christmas Eve',    kind: 'sdc'     },
  { m: 12, d: 25, name: 'Christmas Day',    kind: 'federal' },
];

// Nth-weekday holidays (computed per year)
const NTH_HOLIDAYS = [
  { m: 5,  wd: 1, n: -1, name: 'Memorial Day',                  kind: 'federal' },
  { m: 9,  wd: 1, n: 1,  name: 'Labor Day',                     kind: 'federal' },
  { m: 11, wd: 4, n: 4,  name: 'Thanksgiving Day',              kind: 'federal' },
  { m: 11, wd: 5, n: 4,  name: 'Day After Thanksgiving (SDC)',   kind: 'sdc'     },
];

// Easter dates (Good Friday observed) — update annually
const EASTER_GOOD_FRIDAYS = {
  2024: { m: 3, d: 29 },
  2025: { m: 4, d: 18 },
  2026: { m: 4, d: 3  },
  2027: { m: 3, d: 26 },
  2028: { m: 4, d: 14 },
  2029: { m: 3, d: 30 },
  2030: { m: 4, d: 19 },
};

// Independence Day: Jul 4 observed — if Sat observe Fri+Mon, if Sun observe Mon, else Jul 4
function independenceDayObserved(year) {
  const jul4 = new Date(year, 6, 4);
  const dow = jul4.getDay(); // 0=Sun,6=Sat
  if (dow === 6) {
    // Saturday → observe Fri Jul 3 AND Mon Jul 6
    return [
      { date: new Date(year, 6, 3), name: 'Independence Day (observed Fri)', kind: 'federal' },
      { date: new Date(year, 6, 6), name: 'Independence Day (observed Mon)', kind: 'federal' },
    ];
  } else if (dow === 0) {
    // Sunday → observe Mon Jul 5
    return [{ date: new Date(year, 6, 5), name: 'Independence Day (observed)', kind: 'federal' }];
  } else {
    return [{ date: new Date(year, 6, 4), name: 'Independence Day', kind: 'federal' }];
  }
}

function nthWeekdayOfMonth(year, month, weekday, n) {
  if (n > 0) {
    const first = new Date(year, month - 1, 1);
    const offset = (weekday - first.getDay() + 7) % 7;
    return new Date(year, month - 1, 1 + offset + (n - 1) * 7);
  } else {
    const last = new Date(year, month, 0);
    const offset = (last.getDay() - weekday + 7) % 7;
    return new Date(year, month - 1, last.getDate() - offset);
  }
}

function holidaysForYear(year) {
  const out = [];

  // Fixed-date holidays
  FIXED_HOLIDAYS.forEach(h => {
    out.push({ date: new Date(year, h.m - 1, h.d), title: h.name, category: 'holiday', kind: h.kind, allDay: true, seeded: true });
  });

  // Nth-weekday holidays
  NTH_HOLIDAYS.forEach(h => {
    out.push({ date: nthWeekdayOfMonth(year, h.m, h.wd, h.n), title: h.name, category: 'holiday', kind: h.kind, allDay: true, seeded: true });
  });

  // Independence Day (observance depends on what day Jul 4 falls)
  independenceDayObserved(year).forEach(h => {
    out.push({ date: h.date, title: h.name, category: 'holiday', kind: h.kind, allDay: true, seeded: true });
  });

  // Easter — Good Friday observed
  const gf = EASTER_GOOD_FRIDAYS[year];
  if (gf) {
    out.push({ date: new Date(year, gf.m - 1, gf.d), title: 'Easter (Good Friday Observed)', category: 'holiday', kind: 'sdc', allDay: true, seeded: true });
  }

  return out;
}

const PAY_ANCHOR = new Date(2026, 0, 9);

function paydaysForYear(year) {
  const out = [];
  const ms14 = 14 * 24 * 3600 * 1000;
  let d = new Date(PAY_ANCHOR);
  while (d.getFullYear() > year || (d.getFullYear() === year && d.getMonth() > 0) || d > new Date(year, 0, 14)) {
    d = new Date(d.getTime() - ms14);
  }
  while (d.getFullYear() < year) d = new Date(d.getTime() + ms14);
  while (d.getFullYear() === year) {
    out.push({ date: new Date(d), title: 'Pay Day', category: 'payday', allDay: true, seeded: true });
    d = new Date(d.getTime() + ms14);
  }
  return out;
}

const DEFAULT_EMPLOYEES = [
  { name: 'Samuel Adams',        role: 'SDC Automation', bMonth: 12, bDay: 16 },
  { name: 'Lisa Andreani',       role: 'SDC Automation', bMonth: 3,  bDay: 30 },
  { name: 'Matthew Armand',      role: 'SDC Automation', bMonth: 10, bDay: 27 },
  { name: 'Stephen Belliveau',   role: 'SDC Automation', bMonth: 12, bDay: 24 },
  { name: 'Daniel Belliveau',    role: 'SDC Automation', bMonth: 4,  bDay: 2  },
  { name: 'Joshua Belliveau',    role: 'SDC Automation', bMonth: 11, bDay: 6  },
  { name: 'Ryan Belliveau',      role: 'SDC Automation', bMonth: 5,  bDay: 1  },
  { name: 'Jesse Brown',         role: 'SDC Automation', bMonth: 7,  bDay: 24 },
  { name: 'Dewayne Cantrell',    role: 'SDC Automation', bMonth: 4,  bDay: 25 },
  { name: 'Billy Cantrell',      role: 'SDC Automation', bMonth: 7,  bDay: 22 },
  { name: 'Ashley Cohen',        role: 'SDC Automation', bMonth: 4,  bDay: 21 },
  { name: 'Dave Culbertson',     role: 'SDC Automation', bMonth: 4,  bDay: 17 },
  { name: 'Michael Czenszak',    role: 'SDC Automation', bMonth: 11, bDay: 16 },
  { name: 'Neil Davis',          role: 'SDC Automation', bMonth: 5,  bDay: 27 },
  { name: 'Richard Dula',        role: 'SDC Automation', bMonth: 7,  bDay: 3  },
  { name: 'Robert Galosi',       role: 'SDC Automation', bMonth: 7,  bDay: 27 },
  { name: 'Ivan Galvez',         role: 'SDC Automation', bMonth: 4,  bDay: 1  },
  { name: 'Michael Gast',        role: 'SDC Automation', bMonth: 11, bDay: 26 },
  { name: 'Nick Grande',         role: 'SDC Automation', bMonth: 5,  bDay: 28 },
  { name: 'Sean Hamp',           role: 'SDC Automation', bMonth: 6,  bDay: 1  },
  { name: 'Adam Haviland',       role: 'SDC Automation', bMonth: 11, bDay: 13 },
  { name: 'Mitchell Heinz',      role: 'SDC Automation', bMonth: 3,  bDay: 21 },
  { name: 'Richard Hlavaty',     role: 'SDC Automation', bMonth: 10, bDay: 3  },
  { name: 'Jackie Hlavaty',      role: 'SDC Automation', bMonth: 9,  bDay: 28 },
  { name: 'Jessica Hudak',       role: 'SDC Automation', bMonth: 7,  bDay: 14 },
  { name: 'Caleb Hunkus',        role: 'SDC Automation', bMonth: 3,  bDay: 30 },
  { name: 'Rob Klingensmith',    role: 'SDC Automation', bMonth: 7,  bDay: 25 },
  { name: 'Michael Kuzius',      role: 'SDC Automation', bMonth: 8,  bDay: 31 },
  { name: 'Pat Laffey',          role: 'SDC Automation', bMonth: 3,  bDay: 6  },
  { name: 'Josh Latham',         role: 'SDC Automation', bMonth: 5,  bDay: 5  },
  { name: 'Xiao Li Liu',         role: 'SDC Automation', bMonth: 1,  bDay: 10 },
  { name: 'Uthkala Mallavarapu', role: 'SDC Automation', bMonth: 7,  bDay: 9  },
  { name: 'Darrin McCauley',     role: 'SDC Automation', bMonth: 10, bDay: 17 },
  { name: 'Greg Merrill',        role: 'SDC Automation', bMonth: 12, bDay: 14 },
  { name: 'Jon Miles',           role: 'SDC Automation', bMonth: 5,  bDay: 14 },
  { name: 'Ian Milne',           role: 'SDC Automation', bMonth: 7,  bDay: 25 },
  { name: 'Sandra Morrison',     role: 'SDC Automation', bMonth: 8,  bDay: 26 },
  { name: 'Patrick Morrison',    role: 'SDC Automation', bMonth: 1,  bDay: 18 },
  { name: 'Andrea Myers',        role: 'SDC Automation', bMonth: 3,  bDay: 24 },
  { name: 'Trung Nguyen',        role: 'SDC Automation', bMonth: 1,  bDay: 14 },
  { name: 'Kevin Novotney',      role: 'SDC Automation', bMonth: 4,  bDay: 18 },
  { name: 'Nick Parshall',       role: 'SDC Automation', bMonth: 9,  bDay: 11 },
  { name: 'James Peoples',       role: 'SDC Automation', bMonth: 9,  bDay: 30 },
  { name: 'Jason Perry',         role: 'SDC Automation', bMonth: 7,  bDay: 3  },
  { name: 'Sarah Pfaff',         role: 'SDC Automation', bMonth: 9,  bDay: 2  },
  { name: 'John Piscioneri',     role: 'SDC Automation', bMonth: 7,  bDay: 17 },
  { name: 'Nick Piscioneri',     role: 'SDC Automation', bMonth: 11, bDay: 27 },
  { name: 'Riana Pulsford',      role: 'SDC Automation', bMonth: 4,  bDay: 17 },
  { name: 'John Raguz',          role: 'SDC Automation', bMonth: 4,  bDay: 23 },
  { name: 'Hailey Rizor',        role: 'SDC Automation', bMonth: 1,  bDay: 8  },
  { name: 'Mark Ruane',          role: 'SDC Automation', bMonth: 11, bDay: 27 },
  { name: 'Aubrie Russell',      role: 'SDC Automation', bMonth: 4,  bDay: 8  },
  { name: 'Monica Saggio',       role: 'SDC Automation', bMonth: 3,  bDay: 2  },
  { name: 'Greg Sanford',        role: 'SDC Automation', bMonth: 7,  bDay: 18 },
  { name: 'Mark Savina',         role: 'SDC Automation', bMonth: 2,  bDay: 22 },
  { name: 'Keith Schwentker',    role: 'SDC Automation', bMonth: 7,  bDay: 8  },
  { name: 'Tim Shaffer',         role: 'SDC Automation', bMonth: 12, bDay: 14 },
  { name: 'David Shaner',        role: 'SDC Automation', bMonth: 6,  bDay: 4  },
  { name: 'Andre Shirk',         role: 'SDC Automation', bMonth: 11, bDay: 9  },
  { name: 'Daniel Siegfried',    role: 'SDC Automation', bMonth: 4,  bDay: 4  },
  { name: 'Neil Simpson',        role: 'SDC Automation', bMonth: 9,  bDay: 22 },
  { name: 'Eric Simpson',        role: 'SDC Automation', bMonth: 12, bDay: 30 },
  { name: 'Colin Simpson',       role: 'SDC Automation', bMonth: 1,  bDay: 27 },
  { name: 'Justin Stanko',       role: 'SDC Automation', bMonth: 7,  bDay: 6  },
  { name: 'Frank Stask',         role: 'SDC Automation', bMonth: 4,  bDay: 23 },
  { name: 'Richard Troha',       role: 'SDC Automation', bMonth: 2,  bDay: 27 },
  { name: 'Harlee Valvoda',      role: 'SDC Automation', bMonth: 9,  bDay: 2  },
  { name: 'Paul Vinci',          role: 'SDC Automation', bMonth: 6,  bDay: 8  },
  { name: 'Rick Wagner',         role: 'SDC Automation', bMonth: 11, bDay: 15 },
  { name: 'Greg Weimer',         role: 'SDC Automation', bMonth: 3,  bDay: 1  },
  { name: 'Patrick Wiles',       role: 'SDC Automation', bMonth: 6,  bDay: 22 },
  { name: 'Timothy Wilmot',      role: 'SDC Automation', bMonth: 5,  bDay: 23 },
];

function birthdaysForYear(year, employees) {
  const list = employees || DEFAULT_EMPLOYEES;
  return list.map(e => ({
    date: new Date(year, e.bMonth - 1, e.bDay),
    title: `${e.name}'s Birthday`,
    category: 'birthday',
    meta: { role: e.role, name: e.name },
    allDay: true,
    seeded: true,
  }));
}

function sampleEventsForYear(year) {
  return [
    { date: new Date(year, 0, 14),  title: 'Q1 Kickoff All-Hands',          category: 'company',  time: '10:00', endTime: '11:30', location: 'Main Auditorium', allDay: false, seeded: true },
    { date: new Date(year, 1, 10),  title: 'Annual Strategy Offsite',        category: 'company',  allDay: true,  seeded: true, endDate: new Date(year, 1, 12) },
    { date: new Date(year, 2, 18),  title: 'Engineering Summit',             category: 'company',  time: '09:00', endTime: '17:00', location: 'Floor 4',        allDay: false, seeded: true },
    { date: new Date(year, 3, 22),  title: 'Earth Day Volunteering',         category: 'company',  allDay: true,  seeded: true },
    { date: new Date(year, 4, 20),  title: 'Q2 All-Hands',                  category: 'company',  time: '10:00', endTime: '11:30', location: 'Main Auditorium', allDay: false, seeded: true },
    { date: new Date(year, 5, 17),  title: 'Mid-Year Review',                category: 'meeting',  time: '14:00', endTime: '15:00', allDay: false, seeded: true },
    { date: new Date(year, 7, 19),  title: 'Product Showcase',               category: 'company',  time: '13:00', endTime: '16:00', location: 'Demo Hall',      allDay: false, seeded: true },
    { date: new Date(year, 8, 9),   title: 'Fall Leadership Conference',     category: 'company',  allDay: true,  seeded: true, endDate: new Date(year, 8, 11) },
    { date: new Date(year, 9, 30),  title: 'Benefits Enrollment Deadline',   category: 'deadline', allDay: true,  seeded: true },
    { date: new Date(year, 10, 4),  title: 'Q4 Planning All-Hands',         category: 'company',  time: '10:00', endTime: '11:30', location: 'Main Auditorium', allDay: false, seeded: true },
    { date: new Date(year, 11, 11), title: 'Holiday Party',                  category: 'company',  time: '18:00', endTime: '22:00', location: 'The Grand Hall',  allDay: false, seeded: true },
    { date: new Date(year, 11, 23), title: 'Year-End Close Deadline',        category: 'deadline', allDay: true,  seeded: true },
  ];
}

function seedAllEvents(years, employees) {
  const all = [];
  years.forEach(y => {
    all.push(...holidaysForYear(y));
    all.push(...paydaysForYear(y));
    all.push(...birthdaysForYear(y, employees));
    all.push(...sampleEventsForYear(y));
  });
  return all.map((e, i) => ({ ...e, id: `seed-${i}-${+e.date}` }));
}

window.SDC_DATA = {
  DEFAULT_EMPLOYEES,
  seedAllEvents,
  holidaysForYear,
  paydaysForYear,
  birthdaysForYear,
  sampleEventsForYear,
};
