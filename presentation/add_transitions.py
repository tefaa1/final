import zipfile, shutil, re, os, sys
src = sys.argv[1] if len(sys.argv) > 1 else "Sportify-MSCMS-Overview.pptx"
tmp = src + ".tmp"
# A clean, consistent Fade gives a premium, seamless flow between slides.
TRANS = '<p:transition spd="med"><p:fade/></p:transition>'
zin = zipfile.ZipFile(src, "r")
zout = zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED)
n = 0
for item in zin.infolist():
    data = zin.read(item.filename)
    if re.match(r"ppt/slides/slide\d+\.xml$", item.filename):
        text = data.decode("utf-8")
        if "<p:transition" not in text and "</p:sld>" in text:
            text = text.replace("</p:sld>", TRANS + "</p:sld>", 1)
            n += 1
        data = text.encode("utf-8")
    zout.writestr(item, data)
zin.close(); zout.close()
shutil.move(tmp, src)
print(f"added transitions to {n} slides")
