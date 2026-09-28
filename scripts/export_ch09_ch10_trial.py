"""Create separate mobile trial editions from the chapter 9–10 rhythm experiments.

The V1.0 canonical manuscripts and the existing Part II mobile exports remain
unchanged. This trial edition is for editorial comparison only.
"""
from pathlib import Path
import export_part2_mobile as m

m.CHAPTERS = [
    (9, "九", "署名"),
    (10, "十", "远路"),
]
m.PART_TITLE = "第九、十章改写试读版"
m.CHAPTER_LABEL = "V1.1 · 节奏实验"
m.EPUB_ID = "urn:uuid:no-spoilers-china-ch09-ch10-rhythm-experiment-2026"
m.STEM = "no-spoilers-china-ch09-ch10-rhythm-trial-mobile"

def trial_source(number: int) -> Path:
    assert number in (9, 10)
    return (
        m.ROOT
        / "chapters"
        / f"ch{number:02}"
        / "experiments"
        / "manuscript-v1.1-natural-rhythm.md"
    )

m.source_path = trial_source

if __name__ == "__main__":
    m.main()
