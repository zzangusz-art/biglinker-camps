"""Merge i18n/delta/<lang>.json into i18n/src/<lang>.json and drop retired keys.

  python tools/merge_delta.py ko en        # only these languages
  python tools/merge_delta.py              # every language that has a delta file
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "i18n", "src")
DELTA = os.path.join(ROOT, "i18n", "delta")

RETIRED_PREFIXES = ("toc.", "flow1.", "flow2.", "flow3.", "flow4.")
RETIRED_KEYS = {
    "hero.issue", "hero.place", "hero.badge", "hero.ctaParents", "hero.ctaParentsSub", "hero.ctaKoreaSub",
    "card.study", "card.act", "spec.ratio",
    "partners.flowTitle", "partners.terms.k", "partners.terms.v", "partners.getTitle",
    "get1", "get2", "get3", "get4",
}


def merge(lang):
    src_p = os.path.join(SRC, lang + ".json")
    delta_p = os.path.join(DELTA, lang + ".json")
    if not os.path.exists(delta_p):
        print("no delta:", lang)
        return
    with open(src_p, encoding="utf-8") as f:
        src = json.load(f)
    with open(delta_p, encoding="utf-8") as f:
        delta = json.load(f)
    out = {}
    for k, v in src.items():
        if k in RETIRED_KEYS or k.startswith(RETIRED_PREFIXES):
            continue
        out[k] = delta.get(k, v)
    for k, v in delta.items():
        if k not in out:
            out[k] = v
    with open(src_p, "w", encoding="utf-8") as f:
        f.write(json.dumps(out, ensure_ascii=False, indent=2) + "\n")
    print("%s: %d keys (delta %d)" % (lang, len(out), len(delta)))


if __name__ == "__main__":
    langs = sys.argv[1:] or [n[:-5] for n in sorted(os.listdir(DELTA)) if n.endswith(".json")]
    for lang in langs:
        merge(lang)
