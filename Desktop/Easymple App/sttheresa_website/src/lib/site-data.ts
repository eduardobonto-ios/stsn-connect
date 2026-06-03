export const SITE = {
  name: "St. Theresa's School of Novaliches",
  short: "STSN",
  tagline: "Excellence in Education · Values Formation · Faith",
  email: "stsnbasiceduc@gmail.com",
  phone: "(02) 8275-3916",
  address:
    "7 Kingfisher Street Corner Skylark Subdivision, Barangay Kaligayahan, Novaliches, Quezon City",
  hours: [
    { label: "Monday – Friday", value: "8:00 AM – 5:00 PM" },
    { label: "Saturday", value: "8:00 AM – 12:00 NN" },
    { label: "Sunday", value: "Closed" },
  ],
  social: {
    facebook: "https://www.facebook.com/",
    instagram: "https://www.instagram.com/",
    youtube: "https://www.youtube.com/",
  },
};

export const NAV = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About STSN" },
  { to: "/admission", label: "Admission" },
  { to: "/academics", label: "Academics" },
  { to: "/gallery", label: "Gallery" },
  { to: "/contact", label: "Contact Us" },
];

const IMG = "https://www.stsn.edu.ph/img";
export const PHOTOS = {
  welcome: `${IMG}/stsn2.jpg`,
  programs: [`${IMG}/e1.jpg`, `${IMG}/e2.jpg`, `${IMG}/stsn5.jpg`, `${IMG}/stsn6.jpg`],
  // 12 confirmed gallery photos from the live site
  pool: Array.from({ length: 12 }, (_, i) => `${IMG}/${i + 1}.jpg`),
  extras: [`${IMG}/e1.jpg`, `${IMG}/e2.jpg`, `${IMG}/stsn5.jpg`, `${IMG}/stsn6.jpg`, `${IMG}/stsn2.jpg`],
};

export const ANNOUNCEMENTS = [
  { title: "Enrollment Now Open", body: "SY 2026–2027 admissions are now ongoing." },
  { title: "Opening of Classes", body: "Classes officially begin this June 2026." },
  { title: "School Uniform Update", body: "New uniform guidelines released for all levels." },
];

export const EVENTS = [
  { mon: "JUL", day: "10", title: "Foundation Day", body: "School-wide celebration and activities." },
  { mon: "MAR", day: "15", title: "Recognition Day", body: "Honoring outstanding students." },
  { mon: "JUN", day: "01", title: "School Opening", body: "Start of Academic Year 2026–2027." },
];

export const PROGRAMS = [
  {
    title: "Preschool",
    img: PHOTOS.programs[0],
    desc: "Fun and engaging early childhood learning that builds strong foundations.",
  },
  {
    title: "Elementary",
    img: PHOTOS.programs[1],
    desc: "Developing academic skills, discipline, and strong values.",
  },
  {
    title: "High School",
    img: PHOTOS.programs[2],
    desc: "Preparing students for college and real-world success.",
  },
  {
    title: "Senior High",
    img: PHOTOS.programs[3],
    desc: "Career-focused education for future professionals.",
  },
];

export const CORE_VALUES = [
  { title: "Humility", icon: "HeartHandshake", desc: "Showing respect, kindness, and willingness to learn from others." },
  { title: "Fortitude", icon: "Flame", desc: "Having courage and strength in facing difficulties and challenges." },
  { title: "Perseverance", icon: "Mountain", desc: "Continuing to work hard and never giving up despite obstacles." },
  { title: "Integrity", icon: "ShieldCheck", desc: "Being honest, responsible, and doing the right thing at all times." },
];

export const SCHOOL_EVENTS = [
  {
    title: "Foundation Day Celebration",
    img: PHOTOS.programs[0],
    desc: "Join us as we celebrate the school's Foundation Day with activities, performances, and fun events.",
  },
  {
    title: "Recognition Day",
    img: PHOTOS.programs[1],
    desc: "Honoring outstanding students for their academic excellence and achievements.",
  },
  {
    title: "Sports Festival",
    img: PHOTOS.programs[2],
    desc: "A day full of exciting sports activities that promote teamwork and school spirit.",
  },
  {
    title: "Christmas Program",
    img: PHOTOS.programs[3],
    desc: "Celebrate the holiday season with performances, presentations, and joyful activities.",
  },
];

// Gallery tabs from the live site; the 17 real photos are distributed so every tab is full.
function slice(start: number, count: number) {
  const all = [...PHOTOS.pool, ...PHOTOS.extras];
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(all[(start + i) % all.length]);
  return out;
}

export const GALLERY_TABS = [
  { id: "foundation-day", label: "Foundation Day", photos: PHOTOS.pool.slice(0, 9) },
  { id: "recognition-day", label: "Recognition Day", photos: slice(3, 8) },
  { id: "sports-festival", label: "Sports Festival", photos: slice(6, 8) },
  { id: "fire-drill", label: "Fire Drill", photos: slice(9, 8) },
  { id: "living-rosary", label: "Living Rosary", photos: slice(12, 8) },
  { id: "feast-day", label: "Feast Day", photos: slice(14, 8) },
];
