"""Creates a holding page for every nav screen that has no HTML yet. Safe to re-run: never overwrites."""
import os, re
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
core = open(os.path.join(root,'assets/js/fct-core.js')).read()
items = re.findall(r"\['((?:home|p2p|o2c|r2r|sc|cmp)/[\w-]+)','([^']+)'\]", core)
T = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{label} | FCT</title>
<script src="../../assets/js/load.js"></script>
</head>
<body data-page="{page}" data-root="../../">
<div id="app"></div>
<script>
/* HOLDING PAGE (tools/stub.py). Replace with the full screen. */
FCT.page({{ render(el){{
  const tw='{tw}';
  el.innerHTML = FCT.ui.head('{label}', 'This screen is in the next build step. The open items for this tower are below and fully actionable.') +
    FCT.ui.panel({{title:'Open in '+FCT.towerName(tw), flush:true, body:FCT.ui.queue(FCT.openFor(tw),{{tower:false}})}});
}}}});
</script>
</body>
</html>
"""
n=0
for page,label in items:
    f=os.path.join(root,'screens',page+'.html')
    if not os.path.exists(f):
        open(f,'w').write(T.format(label=label,page=page,tw=page.split('/')[0].upper())); n+=1
print('stubs created:',n)
