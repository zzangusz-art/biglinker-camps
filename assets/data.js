/* BigLinker Camps — catalogue structure. All visible text lives in i18n/<lang>.js under camp.<id>.*
   tend: focus profile 0–100 — s study, a activity, e experience, c career
   needs: tags used by the camp check (need.*) */
window.CAMPS = [
  { id: "cebu",       cats: ["english", "family"],             ages: ["e1", "e2"],      with: "parent", weeks: 3, region: "sea", cost: 2, tend: { s: 60, a: 40, e: 55, c: 10 }, needs: ["first", "speaking", "family"],  img: "cebu-family.jpg" },
  { id: "johor",      cats: ["schooling", "family"],           ages: ["e1", "e2", "m"], with: "parent", weeks: 4, region: "sea", cost: 3, tend: { s: 75, a: 25, e: 70, c: 15 }, needs: ["school", "family"],             img: "johor-school.jpg" },
  { id: "auckland",   cats: ["schooling"],                     ages: ["e2", "m"],       with: "solo",   weeks: 6, region: "oc",  cost: 3, tend: { s: 70, a: 30, e: 85, c: 10 }, needs: ["school", "speaking"],           img: "auckland-school.jpg" },
  { id: "ukboarding", cats: ["english", "activity"],           ages: ["e2", "m"],       with: "solo",   weeks: 2, region: "uk",  cost: 3, tend: { s: 50, a: 55, e: 80, c: 15 }, needs: ["first", "speaking"],            img: "uk-boarding.jpg" },
  { id: "canada",     cats: ["activity"],                      ages: ["e2", "m"],       with: "solo",   weeks: 2, region: "na",  cost: 2, tend: { s: 20, a: 90, e: 70, c: 5 },  needs: ["nature", "first"],              img: "canoe-ontario.jpg" },
  { id: "jeju",       cats: ["english", "activity", "family"], ages: ["e1", "e2"],      with: "parent", weeks: 1, region: "kr",  cost: 1, tend: { s: 55, a: 50, e: 35, c: 5 },  needs: ["first", "speaking", "family"],  img: "jeju-camp.jpg", domestic: true },
  { id: "ukmed",      cats: ["career"],                        ages: ["m", "h"],        with: "solo",   weeks: 1, region: "uk",  cost: 3, tend: { s: 80, a: 15, e: 45, c: 95 }, needs: ["medical", "academic"],          img: "medical-skills.jpg" },
  { id: "lifesci",    cats: ["career", "stem"],                ages: ["h"],             with: "solo",   weeks: 2, region: "eu",  cost: 3, tend: { s: 85, a: 10, e: 40, c: 90 }, needs: ["medical", "stem", "academic"],  img: "life-science-lab.jpg", tall: true },
  { id: "uksummer",   cats: ["summer"],                        ages: ["h", "u"],        with: "solo",   weeks: 3, region: "uk",  cost: 3, tend: { s: 85, a: 15, e: 55, c: 75 }, needs: ["academic"],                     img: "summer-school.jpg" },
  { id: "usleader",   cats: ["summer", "career"],              ages: ["h"],             with: "solo",   weeks: 2, region: "na",  cost: 3, tend: { s: 70, a: 35, e: 60, c: 80 }, needs: ["academic"],                     img: "leadership-seminar.jpg" },
  { id: "aicode",     cats: ["stem"],                          ages: ["m", "h"],        with: "solo",   weeks: 2, region: "uk",  cost: 3, tend: { s: 75, a: 25, e: 45, c: 70 }, needs: ["stem"],                         img: "ai-bootcamp.jpg" },
  { id: "sgstem",     cats: ["stem", "english"],               ages: ["e2", "m"],       with: "solo",   weeks: 2, region: "sea", cost: 2, tend: { s: 65, a: 40, e: 55, c: 35 }, needs: ["stem", "first"],                img: "stem-robot.jpg" },
  { id: "goldcoast",  cats: ["english", "activity", "family"], ages: ["e1", "e2"],      with: "parent", weeks: 2, region: "oc",  cost: 3, tend: { s: 45, a: 60, e: 70, c: 5 },  needs: ["family", "nature", "first"],    img: "gold-coast.jpg" },
  { id: "clark",      cats: ["english"],                       ages: ["e2", "m", "h"],  with: "solo",   weeks: 4, region: "sea", cost: 2, tend: { s: 90, a: 10, e: 30, c: 10 }, needs: ["speaking"],                     img: "clark-1on1.jpg" }
];

window.TENDS = ["study", "act", "exp", "career"];
window.TEND_KEY = { study: "s", act: "a", exp: "e", career: "c" };

/* Filter vocabularies, in display order */
window.FILTERS = {
  cat:    ["english", "schooling", "activity", "family", "career", "summer", "stem"],
  tend:   ["study", "act", "exp", "career"],
  age:    ["e1", "e2", "m", "h", "u"],
  with:   ["parent", "solo"],
  len:    ["1", "2", "3", "5"],
  region: ["sea", "uk", "eu", "na", "oc", "kr"]
};

window.NEEDS = ["first", "speaking", "school", "medical", "stem", "academic", "nature", "family"];

/* Quick picks map to preset filter states */
window.QUICK = [
  { id: "family",   set: { cat: ["family"] } },
  { id: "school",   set: { cat: ["schooling"] } },
  { id: "activity", set: { cat: ["activity"] } },
  { id: "career",   set: { cat: ["career"] } },
  { id: "summer",   set: { cat: ["summer"] } },
  { id: "stem",     set: { cat: ["stem"] } }
];

/* World map. Seoul is the hub; lon/lat in degrees. side = label side (l / r). */
window.MAP_HUB = { lon: 126.98, lat: 37.57 };
window.MAP_OUT = [
  { id: "uk",        lon: -0.13,  lat: 51.5,  region: "uk",  camps: ["ukboarding", "ukmed", "uksummer", "aicode"], side: "l" },
  { id: "europe",    lon: 10.5,   lat: 48.5,  region: "eu",  camps: ["lifesci"],            side: "r" },
  { id: "canada",    lon: -79.4,  lat: 43.7,  region: "na",  camps: ["canada"],             side: "t" },
  { id: "useast",    lon: -71.1,  lat: 42.4,  region: "na",  camps: ["usleader"],           side: "b" },
  { id: "clark",     lon: 120.6,  lat: 15.2,  region: "sea", camps: ["clark"],              side: "l" },
  { id: "cebu",      lon: 123.9,  lat: 10.3,  region: "sea", camps: ["cebu"],               side: "r" },
  { id: "sg",        lon: 103.8,  lat: 1.35,  region: "sea", camps: ["sgstem", "johor"],    side: "l" },
  { id: "goldcoast", lon: 153.4,  lat: -28.0, region: "oc",  camps: ["goldcoast"],          side: "r" },
  { id: "auckland",  lon: 174.8,  lat: -36.85, region: "oc", camps: ["auckland"],           side: "r" },
  { id: "jeju",      lon: 126.5,  lat: 33.4,  region: "kr",  camps: ["jeju"],               side: "l" }
];
window.MAP_IN = [
  { id: "europe",       lon: 2.35,   lat: 48.86, langs: ["en", "fr", "de", "es", "it"], side: "l",
    from: [[-0.13, 51.5], [2.35, 48.86], [13.4, 52.52], [-3.7, 40.42], [12.5, 41.9]] },
  { id: "northamerica", lon: -74.0,  lat: 40.7,  langs: ["en"], side: "l" },
  { id: "mexico",       lon: -99.13, lat: 19.43, langs: ["es"], side: "r" },
  { id: "brazil",       lon: -46.63, lat: -23.55, langs: ["pt"], side: "r" },
  { id: "japan",        lon: 139.69, lat: 35.69, langs: ["ja"], side: "r" },
  { id: "china",        lon: 121.47, lat: 31.23, langs: ["zh"], side: "l" },
  { id: "vietnam",      lon: 105.85, lat: 21.03, langs: ["vi"], side: "l" },
  { id: "thailand",     lon: 100.5,  lat: 13.75, langs: ["th"], side: "l" },
  { id: "indonesia",    lon: 106.85, lat: -6.2,  langs: ["id"], side: "l" }
];

window.ARTICLES = [
  { id: "a1", img: "departure.jpg",      min: 3 },
  { id: "a2", img: "medical-skills.jpg", min: 3 },
  { id: "a3", img: "cebu-family.jpg",    min: 3 }
];

window.LANGS = [
  ["ko", "한국어"], ["en", "English"], ["ja", "日本語"], ["zh", "中文"],
  ["vi", "Tiếng Việt"], ["th", "ไทย"], ["id", "Bahasa Indonesia"], ["es", "Español"],
  ["fr", "Français"], ["de", "Deutsch"], ["it", "Italiano"], ["pt", "Português"]
];
