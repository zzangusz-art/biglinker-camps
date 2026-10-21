"""BigLinker Camps build.

  python tools/build.py

1. i18n/src/<lang>.json  ->  i18n/<lang>.js   (window.I18N[lang] = {...})
2. src/index.template.html + Korean strings  ->  index.html   (Korean text pre-rendered for first paint and search engines)
3. index.html  ->  artifact.html   (same page without the <html>/<head>/<body> wrapper, for claude.ai Artifact publishing)
4. Checks: every key used in the template / app.js exists in every language, placeholders and tags match English.
"""
import html
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, "i18n", "src")
OUT_DIR = os.path.join(ROOT, "i18n")
LANGS = ["ko", "en", "ja", "zh", "vi", "th", "id", "es", "fr", "de", "it", "pt"]


def load(lang):
    p = os.path.join(SRC_DIR, lang + ".json")
    if not os.path.exists(p):
        return None
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def plain(s):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", s)).strip()


def build_js(dicts):
    for lang, d in dicts.items():
        body = json.dumps(d, ensure_ascii=False, separators=(",", ":"))
        with open(os.path.join(OUT_DIR, lang + ".js"), "w", encoding="utf-8") as f:
            f.write("window.I18N=window.I18N||{};window.I18N[%s]=%s;\n" % (json.dumps(lang), body))


def render(template, ko):
    missing = set()

    def text_fill(m):
        key = m.group("key")
        if key not in ko:
            missing.add(key)
            return m.group(0)
        val = ko[key]
        inner = val if m.group("html") else html.escape(val, quote=False)
        return m.group("open") + inner + m.group("close")

    pat = re.compile(
        r'(?P<open><(?P<tag>[a-zA-Z][a-zA-Z0-9]*)\b[^>]*?\bdata-i18n(?P<html>-html)?="(?P<key>[^"]+)"[^>]*>)(?P<close></(?P=tag)>)'
    )
    out = pat.sub(text_fill, template)

    def attr_fill(m):
        tag = m.group(0)
        spec = m.group("spec")
        extra = []
        for pair in spec.split(";"):
            if ":" not in pair:
                continue
            a, k = pair.split(":", 1)
            a, k = a.strip(), k.strip()
            if k not in ko:
                missing.add(k)
                continue
            extra.append('%s="%s"' % (a, html.escape(plain(ko[k]), quote=True)))
        end = "/>" if tag.endswith("/>") else ">"
        return tag[: -len(end)].rstrip() + " " + " ".join(extra) + end

    out = re.sub(r'<[a-zA-Z][^>]*\bdata-i18n-attr="(?P<spec>[^"]+)"[^>]*>', attr_fill, out)
    out = re.sub(r'(<[^>]*\bdata-fig="(\d+)"[^>]*>)(</span>)', lambda m: m.group(1) + ko["fig"] + " " + m.group(2) + m.group(3), out)
    out = re.sub(r'(<[^>]*\bdata-min="(\d+)"[^>]*>)(</span>)', lambda m: m.group(1) + ko["journal.min"].replace("{n}", m.group(2)) + m.group(3), out)
    return out, missing


def artifact_page(page):
    page = re.sub(r"<!doctype html>\s*", "", page, flags=re.I)
    page = re.sub(r"<html[^>]*>\s*|</html>\s*", "", page)
    page = re.sub(r"<head>\s*|</head>\s*|<body>\s*|</body>\s*", "", page)
    page = re.sub(r'<meta charset="utf-8">\s*', "", page)
    page = re.sub(r'<meta name="viewport"[^>]*>\s*', "", page)
    return page


def check(dicts, template, app_js):
    problems = []
    en = dicts["en"]
    used = set(re.findall(r'data-i18n(?:-html)?="([^"]+)"', template))
    for spec in re.findall(r'data-i18n-attr="([^"]+)"', template):
        used |= {p.split(":", 1)[1].strip() for p in spec.split(";") if ":" in p}
    used |= set(re.findall(r"\bt\('([a-zA-Z0-9_.]*[a-zA-Z0-9_])'\s*[,)]", app_js))
    used |= {"fig", "journal.min"}
    for lang, d in dicts.items():
        for k in sorted(used):
            if k not in d:
                problems.append("%s: missing key %s" % (lang, k))
        for k, v in en.items():
            if k not in d:
                problems.append("%s: missing %s" % (lang, k))
                continue
            if type(v) is not type(d[k]):
                problems.append("%s: type differs %s" % (lang, k))
                continue
            src = json.dumps(v, ensure_ascii=False)
            dst = json.dumps(d[k], ensure_ascii=False)
            for token in set(re.findall(r"\{\w+\}|</?(?:br|strong)>", src)):
                if src.count(token) != dst.count(token):
                    problems.append("%s: %s token %s" % (lang, k, token))
            if isinstance(v, list) and len(v) != len(d[k]):
                problems.append("%s: list length %s" % (lang, k))
    return problems


def main():
    dicts = {}
    for lang in LANGS:
        d = load(lang)
        if d is None:
            print("skip (no source):", lang)
            continue
        dicts[lang] = d
    build_js(dicts)

    with open(os.path.join(ROOT, "src", "index.template.html"), encoding="utf-8") as f:
        template = f.read()
    with open(os.path.join(ROOT, "assets", "app.js"), encoding="utf-8") as f:
        app_js = f.read()

    page, missing = render(template, dicts["ko"])
    if missing:
        print("MISSING KO KEYS:", sorted(missing))
    with open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8") as f:
        f.write(page)
    with open(os.path.join(ROOT, "artifact.html"), "w", encoding="utf-8") as f:
        f.write(artifact_page(page))

    problems = check(dicts, template, app_js)
    print("languages:", ", ".join(dicts))
    print("keys (ko):", len(dicts["ko"]))
    if problems:
        print("PROBLEMS (%d):" % len(problems))
        for p in problems[:80]:
            print("  ", p)
        sys.exit(1)
    print("checks: ok")


if __name__ == "__main__":
    main()
