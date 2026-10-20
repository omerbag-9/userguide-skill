"""Prepares a built guide for publishing as a multi-file Claude artifact.

    python3 -I prepare_artifact.py OUT/userguide PUBLISH_DIR

The artifact host wraps the main page in its own <html>/<head>/<body>, so
index.html is rewritten to bare content as PUBLISH_DIR/main.html (it sets
document.body.dataset.page itself). Every other file is copied unchanged and
listed in PUBLISH_DIR/files.json as [{"path": ...}] — pass main.html as
file_path, PUBLISH_DIR as root and that list as files.
"""
import json
import shutil
import sys
from pathlib import Path

src, dst = Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve()
if dst.exists():
    shutil.rmtree(dst)
shutil.copytree(src, dst)

index = (dst / "index.html").read_text(encoding="utf-8")
head = index[index.index("<head>") + 6 : index.index("</head>")]
for tag in ('<meta charset="utf-8" />', '<meta name="viewport" content="width=device-width, initial-scale=1" />'):
    head = head.replace(tag, "")
body_open = index.index("<body")
body = index[index.index(">", body_open) + 1 : index.index("</body>")]
head = head.strip()
# The gallery wants a short name ("Acme Tour"), not "Page | Acme tour".
t0, t1 = head.index("<title>") + 7, head.index("</title>")
name = head[t0:t1].split(" | ")[-1]
head = head[:t0] + (name[:-4] + "Tour" if name.endswith(" tour") else name) + head[t1:]
title_end = head.index("</title>") + len("</title>")
main = head[:title_end] + '\n<script>document.body.dataset.page = "index";</script>\n' + head[title_end:] + "\n" + body
(dst / "main.html").write_text(main, encoding="utf-8")
(dst / "index.html").unlink()

files = sorted(str(p.relative_to(dst)) for p in dst.rglob("*") if p.is_file() and p.name not in ("main.html", "files.json"))
(dst / "files.json").write_text(json.dumps([{"path": f} for f in files]), encoding="utf-8")
print(f"main page: {dst / 'main.html'}\nroot: {dst}\n{len(files)} supporting files listed in {dst / 'files.json'}")
