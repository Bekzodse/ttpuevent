export type Category =
  | "Akademik"
  | "Sport"
  | "Madaniy"
  | "Texnologiya"
  | "Karyera"
  | "Ko'ngilochar";

export interface UniEvent {
  id: string;
  title: string;
  description: string;
  category: Category;
  date: string; // ISO yyyy-mm-dd
  time: string;
  location: string;
  organizer: string;
  capacity: number;
  registered: number;
  gradient: string;
  status: "Kelayotgan" | "Yakunlangan" | "Qoralama";
}

export const categories: Category[] = [
  "Akademik",
  "Sport",
  "Madaniy",
  "Texnologiya",
  "Karyera",
  "Ko'ngilochar",
];

export const events: UniEvent[] = [
  {
    id: "1",
    title: "Hackathon 2026: Smart Campus",
    description:
      "24 soatlik hackathon. Talabalar jamoalarga birlashib, universitet hayotini yengillashtiradigan raqamli yechimlar yaratishadi. Eng yaxshi jamoalar sovrinlar va stajirovka imkoniyatiga ega bo'ladi.",
    category: "Texnologiya",
    date: "2026-12-05",
    time: "09:00",
    location: "Yellow Hall",
    organizer: "Kompyuter fanlari kafedrasi",
    capacity: 120,
    registered: 112,
    gradient: "from-indigo-500 to-purple-600",
    status: "Kelayotgan",
  },
  {
    id: "2",
    title: "Karyera kuni va ish yarmarkasi",
    description:
      "Yetakchi kompaniyalar vakillari bilan uchrashuv, rezyume bo'yicha maslahatlar va joyida suhbatlar. Bitiruvchi kurs talabalari uchun maxsus imkoniyat.",
    category: "Karyera",
    date: "2026-12-12",
    time: "10:00",
    location: "The Annual Conference Hall",
    organizer: "Karyera markazi",
    capacity: 250,
    registered: 210,
    gradient: "from-emerald-500 to-teal-600",
    status: "Kelayotgan",
  },
  {
    id: "3",
    title: "Universitetlararo futbol turniri",
    description:
      "Shahar universitetlari o'rtasidagi yillik futbol turniri. Jamoangizni ro'yxatdan o'tkazing va kubok uchun kurashing!",
    category: "Sport",
    date: "2026-11-28",
    time: "14:00",
    location: "Markaziy stadion",
    organizer: "Sport klubi",
    capacity: 200,
    registered: 190,
    gradient: "from-orange-500 to-red-500",
    status: "Kelayotgan",
  },
  {
    id: "4",
    title: "Ilmiy konferensiya: Sun'iy intellekt",
    description:
      "Sun'iy intellekt va mashinaviy o'rganishning so'nggi yutuqlari bo'yicha ilmiy ma'ruzalar va panel muhokamalar.",
    category: "Akademik",
    date: "2026-12-18",
    time: "11:00",
    location: "Green Hall",
    organizer: "Ilmiy bo'lim",
    capacity: 140,
    registered: 96,
    gradient: "from-sky-500 to-blue-600",
    status: "Kelayotgan",
  },
  {
    id: "5",
    title: "Navro'z bayrami konserti",
    description:
      "Milliy qo'shiqlar, raqslar va an'anaviy taomlar bilan to'la bayram dasturi. Talabalar ijodiy jamoalari ishtirokida.",
    category: "Madaniy",
    date: "2026-11-24",
    time: "17:00",
    location: "The Annual Conference Hall",
    organizer: "Yoshlar ittifoqi",
    capacity: 250,
    registered: 225,
    gradient: "from-pink-500 to-rose-500",
    status: "Kelayotgan",
  },
  {
    id: "6",
    title: "Kino kechasi: Talabalar filmlari",
    description:
      "Talabalar tomonidan suratga olingan qisqa metrajli filmlar namoyishi va muallif bilan suhbat.",
    category: "Ko'ngilochar",
    date: "2026-11-10",
    time: "19:00",
    location: "Yellow Hall",
    organizer: "Media klub",
    capacity: 120,
    registered: 120,
    gradient: "from-violet-500 to-fuchsia-500",
    status: "Yakunlangan",
  },
];

export const registrations = [
  { name: "Aziz Karimov", event: "Hackathon 2026: Smart Campus", date: "2026-11-17" },
  { name: "Malika Yusupova", event: "Karyera kuni va ish yarmarkasi", date: "2026-11-17" },
  { name: "Jasur Toshmatov", event: "Universitetlararo futbol turniri", date: "2026-11-16" },
  { name: "Dilnoza Rahimova", event: "Navro'z bayrami konserti", date: "2026-11-16" },
  { name: "Sardor Aliyev", event: "Ilmiy konferensiya: Sun'iy intellekt", date: "2026-11-15" },
];

export function getEvent(id: string) {
  return events.find((e) => e.id === id);
}

export function formatDate(iso: string) {
  const months = [
    "yanvar", "fevral", "mart", "aprel", "may", "iyun",
    "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
  ];
  const [y, m, d] = iso.split("-").map(Number);
  return `${d}-${months[m - 1]}, ${y}`;
}
