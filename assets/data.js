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

/* Hero globe. Seoul is the hub. A place can send Korean students out (camps) and/or bring
   international students in (langs = language regions served by this site). side = label side (l / r). */
window.MAP_HUB = { lon: 126.98, lat: 37.57 };
window.GLOBE_PLACES = [
  { id: "uk",        lon: -0.13,  lat: 51.5,   camps: ["ukboarding", "ukmed", "uksummer", "aicode"], region: "uk", langs: ["en"], side: "l" },
  { id: "europe",    lon: 9.5,    lat: 47.5,   camps: ["lifesci"], region: "eu", langs: ["fr", "de", "es", "it"], side: "r",
    from: [[2.35, 48.86], [13.4, 52.52], [-3.7, 40.42], [12.5, 41.9]] },
  { id: "canada",    lon: -79.4,  lat: 43.7,   camps: ["canada"], region: "na", side: "l" },
  { id: "useast",    lon: -72.0,  lat: 41.6,   camps: ["usleader"], region: "na", langs: ["en"], side: "r" },
  { id: "mexico",    lon: -99.13, lat: 19.43,  langs: ["es"], side: "l" },
  { id: "brazil",    lon: -46.63, lat: -23.55, langs: ["pt"], side: "r" },
  { id: "japan",     lon: 139.69, lat: 35.69,  langs: ["ja"], side: "r" },
  { id: "china",     lon: 116.4,  lat: 39.9,   langs: ["zh"], side: "l" },
  { id: "vietnam",   lon: 105.85, lat: 21.03,  langs: ["vi"], side: "l" },
  { id: "thailand",  lon: 100.5,  lat: 13.75,  langs: ["th"], side: "l" },
  { id: "indonesia", lon: 106.85, lat: -6.2,   langs: ["id"], side: "l" },
  { id: "clark",     lon: 120.6,  lat: 15.2,   camps: ["clark"], region: "sea", side: "l" },
  { id: "cebu",      lon: 123.9,  lat: 10.3,   camps: ["cebu"], region: "sea", side: "r" },
  { id: "sg",        lon: 103.8,  lat: 1.35,   camps: ["sgstem", "johor"], region: "sea", side: "r" },
  { id: "goldcoast", lon: 153.4,  lat: -28.0,  camps: ["goldcoast"], region: "oc", side: "l" },
  { id: "auckland",  lon: 174.8,  lat: -36.85, camps: ["auckland"], region: "oc", side: "r" },
  { id: "jeju",      lon: 126.5,  lat: 33.4,   camps: ["jeju"], region: "kr", side: "l" }
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
