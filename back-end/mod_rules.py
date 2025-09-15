import re
from dataclasses import dataclass
from typing import List, Tuple


@dataclass
class RuleHit:
    rule: str
    score: int
    detail: str | None = None


BLACKLIST = [
    r"(?i)buy followers",
    r"(?i)adult",
    r"(?i)bitcoin giveaway",
]
MAX_LINKS = 5
MAX_MENTIONS = 10


def evaluate(raw_html: str) -> Tuple[int, List[RuleHit]]:
    text = re.sub(r"<[^>]+>", " ", raw_html or "")
    hits: List[RuleHit] = []
    score = 0

    for patt in BLACKLIST:
        m = re.search(patt, text)
        if m:
            hits.append(RuleHit("blacklist", 10, m.group(0)))
            score += 10

    links = len(re.findall(r"https?://", text))
    if links > MAX_LINKS:
        hits.append(RuleHit("too_many_links", 3, str(links)))
        score += 3

    mentions = len(re.findall(r"@\w+", text))
    if mentions > MAX_MENTIONS:
        hits.append(RuleHit("too_many_mentions", 2, str(mentions)))
        score += 2

    if len(text.strip()) < 5:
        hits.append(RuleHit("too_short", 2))
        score += 2

    return score, hits

