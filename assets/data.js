/* BigLinker Camps — catalogue structure. All visible text lives in i18n/<lang>.js under camp.<id>.* */
window.CAMPS = [
  { id: "cebu",       cats: ["english", "family"],             ages: ["e1", "e2"],      with: "parent", weeks: 3, region: "sea", cost: 2, study: 60, img: "cebu-family.jpg" },
  { id: "johor",      cats: ["schooling", "family"],           ages: ["e1", "e2", "m"], with: "parent", weeks: 4, region: "sea", cost: 3, study: 75, img: "johor-school.jpg" },
  { id: "auckland",   cats: ["schooling"],                     ages: ["e2", "m"],       with: "solo",   weeks: 6, region: "oc",  cost: 3, study: 70, img: "auckland-school.jpg" },
  { id: "ukboarding", cats: ["english", "activity"],           ages: ["e2", "m"],       with: "solo",   weeks: 2, region: "uk",  cost: 3, study: 50, img: "uk-boarding.jpg" },
  { id: "canada",     cats: ["activity"],                      ages: ["e2", "m"],       with: "solo",   weeks: 2, region: "na",  cost: 2, study: 20, img: "canoe-ontario.jpg" },
  { id: "jeju",       cats: ["english", "activity", "family"], ages: ["e1", "e2"],      with: "parent", weeks: 1, region: "kr",  cost: 1, study: 55, img: "jeju-camp.jpg", domestic: true },
  { id: "ukmed",      cats: ["career"],                        ages: ["m", "h"],        with: "solo",   weeks: 1, region: "uk",  cost: 3, study: 80, img: "medical-skills.jpg" },
  { id: "lifesci",    cats: ["career", "stem"],                ages: ["h"],             with: "solo",   weeks: 2, region: "eu",  cost: 3, study: 85, img: "life-science-lab.jpg", tall: true },
  { id: "uksummer",   cats: ["summer"],                        ages: ["h", "u"],        with: "solo",   weeks: 3, region: "uk",  cost: 3, study: 85, img: "summer-school.jpg" },
  { id: "usleader",   cats: ["summer", "career"],              ages: ["h"],             with: "solo",   weeks: 2, region: "na",  cost: 3, study: 70, img: "leadership-seminar.jpg" },
  { id: "aicode",     cats: ["stem"],                          ages: ["m", "h"],        with: "solo",   weeks: 2, region: "uk",  cost: 3, study: 75, img: "ai-bootcamp.jpg" },
  { id: "sgstem",     cats: ["stem", "english"],               ages: ["e2", "m"],       with: "solo",   weeks: 2, region: "sea", cost: 2, study: 65, img: "stem-robot.jpg" },
  { id: "goldcoast",  cats: ["english", "activity", "family"], ages: ["e1", "e2"],      with: "parent", weeks: 2, region: "oc",  cost: 3, study: 45, img: "gold-coast.jpg" },
  { id: "clark",      cats: ["english"],                       ages: ["e2", "m", "h"],  with: "solo",   weeks: 4, region: "sea", cost: 2, study: 85, img: "clark-1on1.jpg" }
];

/* Filter vocabularies, in display order */
window.FILTERS = {
  cat:    ["english", "schooling", "activity", "family", "career", "summer", "stem"],
  age:    ["e1", "e2", "m", "h", "u"],
  with:   ["parent", "solo"],
  len:    ["1", "2", "3", "5"],
  region: ["sea", "uk", "eu", "na", "oc", "kr"]
};

/* Quick picks map to preset filter states */
window.QUICK = [
  { id: "family",   set: { cat: ["family"] } },
  { id: "school",   set: { cat: ["schooling"] } },
  { id: "activity", set: { cat: ["activity"] } },
  { id: "career",   set: { cat: ["career"] } },
  { id: "summer",   set: { cat: ["summer"] } },
  { id: "stem",     set: { cat: ["stem"] } }
];

/* World → Korea programme index */
window.KOREA = [
  { id: "p1", img: "kpop-dance.jpg",     real: true },
  { id: "p2", img: "kpop-friends.jpg",   real: true },
  { id: "p3", img: "broadcast-room.jpg", real: true },
  { id: "p4", img: "seoul-campus.jpg",   real: false },
  { id: "p5", img: "kpop-showcase.jpg",  real: true },
  { id: "p6", img: "seoul-forest.jpg",   real: true }
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
