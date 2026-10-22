/**
 * BigLinker Camps 상담·기관 문의 수신 — Google Apps Script 웹앱
 * 홈페이지 신청서 → 구글 시트 한 줄 저장 → 메일 알림 (+ 선택: 슬랙)
 * 구조는 인프 병원청소 수신 코드와 같습니다. 설정 방법은 같은 폴더의 「설정가이드.md」 참고.
 */
const CONFIG = {
  SHEET_NAME: '캠프 상담 DB',
  NOTIFY_TO: 'biglinkerkor@gmail.com',   // 알림 받을 메일. 여러 명이면 쉼표로: 'a@x.com,b@y.com'
  ID_PREFIX: 'BC'                        // 접수번호 앞자리 (BC + 날짜 + 순번)
};

const HEAD = ['접수일시', '접수번호', '상태', '구분', '역할', '이름', '연락처', '이메일', '학년·나이', '관심 캠프', '희망 시기',
  '문의 내용', '진단 조건', '사이트 언어',
  'utm_source', 'utm_medium', 'utm_campaign', '검색어(utm_term/n_query)', 'gclid', '유입 referrer', '첫 랜딩', '신청 페이지', '기기', '작성시간(초)'];

const KIND = { consult: '상담', partner: '기관·파트너', diag: '진단 결과 상담' };

/* ---------------- 신청 접수 ---------------- */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (d.hp) return out_({ ok: true, id: '-' });                                    // 스팸봇(숨김 필드 입력)
    const contact = String(d.contact || '').trim();
    if (!d.name || !contact) return out_({ ok: false, error: '필수값 누락' });
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    const digits = contact.replace(/\D/g, '');
    if (!isEmail && digits.length < 8) return out_({ ok: false, error: '연락처 형식 오류' });
    if (!d.agree) return out_({ ok: false, error: '개인정보 이용 동의 필요' });

    const key = 'c_' + (isEmail ? contact.toLowerCase() : digits);                 // 같은 연락처 2분 내 중복 제출 방지
    const cache = CacheService.getScriptCache();
    const prev = cache.get(key);
    if (prev) return out_({ ok: true, id: prev, dup: true });

    lock.waitLock(20000);
    const sh = sheet_();
    const id = CONFIG.ID_PREFIX + Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyMMdd') + '-' + String(sh.getLastRow()).padStart(4, '0');
    const a = d.attr || {};
    sh.appendRow([
      new Date(), id, '접수', KIND[d.form] || d.form || '상담', d.role || '', d.name,
      isEmail ? '' : "'" + contact, isEmail ? contact : '',
      d.grade || '', d.interest || '', d.when || '', d.msg || '', d.diag || '', d.lang || '',
      a.utm_source || '', a.utm_medium || '', a.utm_campaign || '', a.utm_term || a.n_query || '', a.gclid || '',
      a.referrer || '', a.landing || '', d.page || '', /Mobi|Android|iPhone/i.test(d.ua || '') ? '모바일' : 'PC', Math.round((d.dwell || 0) / 1000)
    ]);
    SpreadsheetApp.flush();
    cache.put(key, id, 120);
    lock.releaseLock();

    try { notify_(id, d, isEmail ? contact : ''); } catch (err) { console.error('알림 실패(접수는 저장됨)', err); }
    return out_({ ok: true, id: id });
  } catch (err) {
    console.error(err);
    return out_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e) { }
  }
}

/* 상태 확인용 (개인정보는 내보내지 않음) */
function doGet() {
  return out_({ ok: true, service: 'biglinker-camps-leads' });
}

/* ---------------- 내부 함수 ---------------- */
function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(CONFIG.SHEET_NAME);
    sh.appendRow(HEAD);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEAD.length).setFontWeight('bold').setBackground('#F2C230').setFontColor('#151515');
    const rule = SpreadsheetApp.newDataValidation().requireValueInList(['접수', '상담 중', '자료 발송', '상담 완료', '등록', '보류', '취소'], true).build();
    sh.getRange('C2:C').setDataValidation(rule);
    sh.setColumnWidth(1, 150); sh.setColumnWidth(6, 110); sh.setColumnWidth(10, 240); sh.setColumnWidth(12, 320); sh.setColumnWidth(13, 260);
  }
  return sh;
}

function notify_(id, d, email) {
  const at = d.attr || {};
  const rows = [
    ['접수번호', id], ['구분', KIND[d.form] || d.form], ['역할', d.role], ['이름', d.name], ['연락처', d.contact],
    ['학년·나이', d.grade], ['관심 캠프', d.interest], ['희망 시기', d.when], ['문의 내용', d.msg], ['진단 조건', d.diag],
    ['사이트 언어', d.lang], ['유입', [at.utm_source, at.utm_term || at.n_query, at.referrer].filter(String).join(' / ')]
  ].filter(r => r[1]);
  const esc = v => String(v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const html = '<h2 style="font-family:sans-serif">BigLinker Camps 새 문의</h2><table style="font-family:sans-serif;border-collapse:collapse">' +
    rows.map(r => '<tr><td style="padding:6px 12px;background:#FBEBB0;font-weight:bold;white-space:nowrap">' + r[0] + '</td><td style="padding:6px 12px">' + esc(r[1]).replace(/\n/g, '<br>') + '</td></tr>').join('') +
    '</table><p style="font-family:sans-serif"><a href="' + SpreadsheetApp.getActiveSpreadsheet().getUrl() + '">구글 시트에서 보기</a></p>';
  const mail = {
    to: CONFIG.NOTIFY_TO,
    subject: '[BigLinker Camps] ' + (KIND[d.form] || '상담') + ' · ' + (d.name || '') + (d.role ? ' (' + d.role + ')' : '') + ' · ' + id,
    htmlBody: html,
    name: 'BigLinker Camps 홈페이지'
  };
  if (email) mail.replyTo = email;                                                   // 메일에서 바로 답장하면 신청자에게 감
  MailApp.sendEmail(mail);

  const hook = PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK');  // 선택: 슬랙 알림 (URL은 서버에만 보관)
  if (hook) {
    UrlFetchApp.fetch(hook, {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      payload: JSON.stringify({ text: 'BigLinker Camps 문의 ' + id + '\n' + rows.map(r => '*' + r[0] + '*: ' + r[1]).join('\n') })
    });
  }
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------------- 설치 · 점검용 (편집기에서 직접 실행) ---------------- */
function setup() {
  sheet_();
  MailApp.getRemainingDailyQuota();
  Logger.log('시트 준비 완료. 오늘 남은 메일 발송량: ' + MailApp.getRemainingDailyQuota());
}

function testPost() {
  const res = doPost({ postData: { contents: JSON.stringify({
    form: 'diag', role: '학부모', name: '테스트', contact: 'test@example.com', grade: '중학생', interest: '영국 의대 진로 체험 캠프',
    when: '2027 여름방학', msg: '테스트 문의입니다.', diag: '중학생, 아이 혼자, 진로, 영국', lang: 'ko', agree: true,
    attr: { utm_source: 'test' }, page: 'apps-script-test', ua: 'test', dwell: 42000
  }) } });
  Logger.log(res.getContent());
}
