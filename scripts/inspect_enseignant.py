from pathlib import Path
path = Path('eduleb/dashboards/enseignant.html')
text = path.read_text(encoding='utf-8')
idx = text.find('<nav class="side-nav">')
print('idx', idx)
print(text[idx:idx+400])
