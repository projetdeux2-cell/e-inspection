from pathlib import Path
import re
base = Path('eduleb/dashboards')
school_files = ['ecole.html','ecole-calendrier.html','ecole-enseignants.html','ecole-observations.html','ecole-plan-daction.html','ecole-rapports.html','ecole-recommandations.html','valider-enseignants.html']
teacher_files = ['enseignant.html','enseignant-rapport.html','enseignant-observation.html','enseignant-Actions-pedagogiques.html']
direction_files = ['direction.html','calendrier-direction.html','consultation-rapports.html','statistiques-direction.html','recommandations-direction.html','assigner-mission.html']
inspector_files = ['inspecteur.html','missions-inspecteur.html','calendrier-inspecteur.html','fiches-inspecteur.html','rapports-inspecteur.html','creer-rapport-inspecteur.html']
all_files = school_files + teacher_files + direction_files + inspector_files
insert_profile = 'href="profile.html"><span class="ti-settings"></span>Paramètres</a>\n                <a href="deconnexion.html"'
patch_count = 0
for fname in all_files:
    path = base / fname
    if not path.exists():
        print('MISSING', fname)
        continue
    text = path.read_text(encoding='utf-8')
    orig = text
    if fname in school_files:
        text = text.replace('href="valider-enseignants.html"', 'href="ajouter-enseignant.html"')
        text = text.replace('Validation enseignants', 'Créer un enseignant')
    if fname in teacher_files:
        text = text.replace('href="admin-profile.html"', 'href="profile.html"')
    if 'href="profile.html"' not in text and 'href="deconnexion.html"' in text:
        text = text.replace('href="deconnexion.html"', insert_profile, 1)
    if text != orig:
        path.write_text(text, encoding='utf-8')
        print('PATCHED', fname)
        patch_count += 1
print('Done', patch_count, 'files patched')
