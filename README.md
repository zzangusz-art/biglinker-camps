# BigLinker Camps

(주)빅링커 캠프 플랫폼 홈페이지. 12개 언어(ko, en, ja, zh, vi, th, id, es, fr, de, it, pt).

## 문구 수정
1. `i18n/src/<언어>.json`을 고칩니다. 한국어 원문은 `ko.json`.
2. `python tools/build.py`를 실행합니다. `i18n/*.js`와 `index.html`이 다시 만들어지고, 12개 언어의 키·태그 누락을 검사합니다.
3. 커밋 후 푸시하면 GitHub Pages에 반영됩니다.

캠프 목록 구조(분야·대상·기간·지역·이미지)는 `assets/data.js`, 마크업 원본은 `src/index.template.html`입니다.
