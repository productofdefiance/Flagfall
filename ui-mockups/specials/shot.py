import re, sys
from playwright.sync_api import sync_playwright
# Render saved .dc.html artboards as plain pages (strip the canvas runtime) and screenshot them.
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for src, out in zip(sys.argv[1::2], sys.argv[2::2]):
        h = open(src).read()
        h = h.replace('<script src="./support.js"></script>', '').replace('<x-dc>', '').replace('</x-dc>', '').replace('<helmet>', '').replace('</helmet>', '')
        h = re.sub(r'<script type="text/x-dc".*?</script>', '', h, flags=re.S)
        open(out + '.html', 'w').write(h)
        pg = b.new_page(viewport={'width': 393, 'height': 665})
        pg.goto('file://' + out + '.html'); pg.wait_for_timeout(900); pg.screenshot(path=out); pg.close()
    b.close()
