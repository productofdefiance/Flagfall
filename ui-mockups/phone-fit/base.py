import json, re
from playwright.sync_api import sync_playwright
def click(pg,txt):
    return pg.evaluate("""(w)=>{const c=[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&!b.disabled);const b=c.find(x=>x.innerText.trim().toLowerCase().startsWith(w.toLowerCase()));if(b){b.click();return true}return false}""",txt)
def start(b,H=665,fmt='7v7',scale=1,deploy=False):
    pg=b.new_page(viewport={'width':393,'height':H},device_scale_factor=scale,has_touch=True,is_mobile=True)
    pg.goto('http://localhost:8102/index.html?shots=1'); pg.wait_for_timeout(900)
    click(pg,'New game'); pg.wait_for_timeout(300); click(pg,fmt); pg.wait_for_timeout(200)
    click(pg,'Next: Teams'); pg.wait_for_timeout(300); click(pg,'Next: Lineup'); pg.wait_for_timeout(300); click(pg,'Start match'); pg.wait_for_timeout(600)
    if deploy: return pg
    for i in range(4):
        if click(pg,'Fill rest'): pg.wait_for_timeout(300)
        if click(pg,'Ready'): pg.wait_for_timeout(1200)
    pg.wait_for_timeout(2500)
    return pg
