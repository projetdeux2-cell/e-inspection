function normalizeList(payload) {
	if (Array.isArray(payload)) return payload;
	if (Array.isArray(payload?.data)) return payload.data;
	return [];
}

function safeText(value, fallback = "-") {
	return value === undefined || value === null || value === "" ? fallback : value;
}

function sectionHtml(id, title, body) {
	return `
		<section class="panel role-section" id="${id}">
			<div class="panel-head"><h2>${title}</h2><a href="#top">Haut</a></div>
			${body}
		</section>
	`;
}

function tableHtml(headers, rows) {
	return `
		<table class="data-table">
			<thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead>
			<tbody>${rows.join("")}</tbody>
		</table>
	`;
}

function renderRows(items, mapper, emptyText = "Aucune donnee disponible.") {
	if (!items.length) {
		return [`<tr><td colspan="5">${emptyText}</td></tr>`];
	}
	return items.map(mapper);
}

async function fetchList(resource) {
	if (!window.EducInspectApi?.token) return [];
	try {
		return normalizeList(await window.EducInspectApi.list(resource));
	} catch (error) {
		console.warn(`Impossible de charger ${resource}`, error);
		return [];
	}
}

async function buildAdminSections() {
	const [departments, communes, schools, inspectors] = await Promise.all([
		fetchList("departments"),
		fetchList("communes"),
		fetchList("schools"),
		fetchList("inspectors")
	]);

	return [
		sectionHtml("utilisateurs", "Utilisateurs", tableHtml(["Nom", "Email", "Role", "Etat"], [
			`<tr><td><strong>Administrateur</strong><span>Supervision technique</span></td><td>admin@e-inspection.local</td><td>Admin</td><td><mark class="badge success">Actif</mark></td></tr>`,
			`<tr><td><strong>Direction departementale</strong><span>Validation et suivi</span></td><td>direction@e-inspection.local</td><td>Direction</td><td><mark class="badge success">Actif</mark></td></tr>`,
			`<tr><td><strong>Koffi A. Mensah</strong><span>Inspection pedagogique</span></td><td>koffi.mensah@educinspect.bj</td><td>Inspecteur</td><td><mark class="badge success">Actif</mark></td></tr>`,
			`<tr><td><strong>Directeur Ecole</strong><span>Suivi local</span></td><td>ecole@e-inspection.local</td><td>Ecole</td><td><mark class="badge success">Actif</mark></td></tr>`,
			`<tr><td><strong>Enseignant Demo</strong><span>Suivi pedagogique</span></td><td>enseignant@e-inspection.local</td><td>Enseignant</td><td><mark class="badge success">Actif</mark></td></tr>`
		])),
		sectionHtml("roles-et-permissions", "Roles et permissions", tableHtml(["Role", "Droits principaux", "Separation"], [
			`<tr><td><strong>Admin</strong></td><td>Utilisateurs, ecoles, inspecteurs, departements, communes</td><td><mark class="badge success">Separe</mark></td></tr>`,
			`<tr><td><strong>Direction</strong></td><td>Statistiques, validation rapports, supervision recommandations</td><td><mark class="badge success">Separe</mark></td></tr>`,
			`<tr><td><strong>Inspecteur</strong></td><td>Missions, fiches, rapports, recommandations</td><td><mark class="badge success">Separe</mark></td></tr>`,
			`<tr><td><strong>Ecole</strong></td><td>Rapports recus, plan d'action, observations</td><td><mark class="badge success">Separe</mark></td></tr>`,
			`<tr><td><strong>Enseignant</strong></td><td>Observations, actions pedagogiques, rapports consultables</td><td><mark class="badge success">Separe</mark></td></tr>`
		])),
		sectionHtml("departements", "Departements", tableHtml(["Departement", "Code", "Chef-lieu", "Etat"], renderRows(departments, (item) =>
			`<tr><td><strong>${safeText(item.name)}</strong></td><td>${safeText(item.code)}</td><td>${safeText(item.capital)}</td><td><mark class="badge success">Actif</mark></td></tr>`
		))),
		sectionHtml("communes", "Communes", tableHtml(["Commune", "Code", "Departement", "Etat"], renderRows(communes, (item) =>
			`<tr><td><strong>${safeText(item.name)}</strong></td><td>${safeText(item.code)}</td><td>${safeText(item.department?.name)}</td><td><mark class="badge success">Actif</mark></td></tr>`
		))),
		sectionHtml("ecoles", "Ecoles", tableHtml(["Ecole", "Commune", "Directeur", "Effectif"], renderRows(schools, (item) =>
			`<tr><td><strong>${safeText(item.name)}</strong><span>${safeText(item.code)}</span></td><td>${safeText(item.commune?.name)}</td><td>${safeText(item.director_name)}</td><td>${safeText(item.student_count)}</td></tr>`
		))),
		sectionHtml("inspecteurs", "Inspecteurs", tableHtml(["Inspecteur", "Matricule", "Specialite", "Telephone"], renderRows(inspectors, (item) =>
			`<tr><td><strong>${safeText(item.user?.name)}</strong><span>${safeText(item.user?.email)}</span></td><td>${safeText(item.registration_number)}</td><td>${safeText(item.specialty)}</td><td>${safeText(item.phone)}</td></tr>`
		))),
		sectionHtml("parametres", "Parametres", tableHtml(["Parametre", "Description", "Statut"], [
			`<tr><td><strong>Critères d'evaluation</strong></td><td>Gestion de la grille d'inspection</td><td><mark class="badge info">Configurable</mark></td></tr>`,
			`<tr><td><strong>Nomenclature</strong></td><td>Types d'ecoles, roles, statuts</td><td><mark class="badge info">Configurable</mark></td></tr>`,
			`<tr><td><strong>Informations plateforme</strong></td><td>Nom, contact, assistance</td><td><mark class="badge info">Configurable</mark></td></tr>`
		]))
	];
}

async function buildDirectionSections() {
	const missions = await fetchList("missions");
	return [
		sectionHtml("calendrier-direction", "Calendrier de suivi", tableHtml(["Ecole", "Date", "Inspecteur", "Statut"], renderRows(missions, (item) =>
			`<tr><td><strong>${safeText(item.school?.name)}</strong><span>${safeText(item.school?.commune?.name)}</span></td><td>${safeText(item.planned_date)}</td><td>${safeText(item.inspector?.user?.name)}</td><td><mark class="${badgeClass(item.status)}">${safeText(item.status)}</mark></td></tr>`
		))),
		sectionHtml("statistiques", "Statistiques direction", `<p>Les indicateurs de couverture, de qualite et de suivi sont charges depuis le backend sur les cartes du tableau de bord.</p>`),
		sectionHtml("recommandations", "Recommandations a superviser", tableHtml(["Action", "Responsable", "Priorite"], [
			`<tr><td><strong>Relancer les ecoles en retard</strong></td><td>Direction departementale</td><td><mark class="badge warning">Haute</mark></td></tr>`,
			`<tr><td><strong>Valider les rapports en attente</strong></td><td>Direction departementale</td><td><mark class="badge info">Normale</mark></td></tr>`
		]))
	];
}

async function buildInspectorSections() {
	const missions = await fetchList("missions");
	return [
		sectionHtml("calendrier-inspecteur", "Mon calendrier", tableHtml(["Ecole", "Date", "Commune", "Statut"], renderRows(missions, (item) =>
			`<tr><td><strong>${safeText(item.school?.name)}</strong></td><td>${safeText(item.planned_date)}</td><td>${safeText(item.school?.commune?.name)}</td><td><mark class="${badgeClass(item.status)}">${safeText(item.status)}</mark></td></tr>`
		))),
		sectionHtml("fiches-inspecteur", "Fiches d'inspection", `<p>Zone de remplissage des fiches numeriques de l'inspecteur. Les notes et observations seront sauvegardees par l'API inspections/evaluations.</p>`),
		sectionHtml("rapports-inspecteur", "Rapports produits", tableHtml(["Rapport", "Ecole", "Score", "Etat"], [
			`<tr><td><strong>RIP-2026-001</strong></td><td>Ecole Primaire Wologuede</td><td>82%</td><td><mark class="badge success">Produit</mark></td></tr>`,
			`<tr><td><strong>RIP-2026-002</strong></td><td>Ecole Primaire Tokpa</td><td>65%</td><td><mark class="badge info">En validation</mark></td></tr>`
		]))
	];
}

function buildSchoolSections() {
	return [
		sectionHtml("plan-daction", "Plan d'action", `<p>La direction d'ecole suit ici les actions correctives demandees apres inspection.</p>`),
		sectionHtml("observations", "Observations recues", tableHtml(["Observation", "Source", "Statut"], [
			`<tr><td><strong>Renforcer le suivi des eleves en difficulte</strong></td><td>Inspection pedagogique</td><td><mark class="badge warning">En cours</mark></td></tr>`,
			`<tr><td><strong>Mettre a jour les documents de classe</strong></td><td>Inspection pedagogique</td><td><mark class="badge info">A suivre</mark></td></tr>`
		]))
	];
}

function buildTeacherSections() {
	return [
		sectionHtml("observations", "Observations pedagogiques", tableHtml(["Observation", "Classe", "Statut"], [
			`<tr><td><strong>Varier les supports d'apprentissage</strong></td><td>CP1</td><td><mark class="badge warning">A appliquer</mark></td></tr>`,
			`<tr><td><strong>Suivre les progres individuels</strong></td><td>CP1</td><td><mark class="badge info">En cours</mark></td></tr>`
		])),
		sectionHtml("actions-pedagogiques", "Actions pedagogiques", `<p>Ces actions concernent uniquement l'enseignant connecte et son suivi de classe.</p>`)
	];
}

function fixMenuLinks(role) {
	const map = {
		admin: {
			"Utilisateurs": "utilisateurs",
			"Roles et permissions": "roles-et-permissions",
			"Departements": "departements",
			"Communes": "communes",
			"Ecoles": "ecoles",
			"Inspecteurs": "inspecteurs",
			"Parametres": "parametres"
		},
		directeur_departemental: {
			"Calendrier": "calendrier-direction",
			"Rapports a valider": "rapports-direction",
			"Statistiques": "statistiques",
			"Recommandations": "recommandations"
		},
		inspecteur: {
			"Missions": "missions-inspecteur",
			"Calendrier": "calendrier-inspecteur",
			"Fiches": "fiches-inspecteur",
			"Rapports": "rapports-inspecteur"
		},
		directeur_ecole: {
			"Rapports": "rapports-ecole",
			"Plan d'action": "plan-daction",
			"Observations": "observations"
		},
		enseignant: {
			"Rapports": "rapports-enseignant",
			"Observations": "observations",
			"Actions pedagogiques": "actions-pedagogiques"
		}
	};

	const links = map[role] || {};
	document.querySelectorAll(".side-nav a").forEach((link) => {
		const text = link.textContent.trim();
		if (links[text]) link.href = `#${links[text]}`;
	});
}

async function setupRoleDashboard() {
	const role = document.body.dataset.requiredRole;
	const main = document.querySelector(".main");
	if (!role || !main) return;

	fixMenuLinks(role);

	let sections = [];
	if (role === "admin") sections = await buildAdminSections();
	if (role === "directeur_departemental") sections = await buildDirectionSections();
	if (role === "inspecteur") sections = await buildInspectorSections();
	if (role === "directeur_ecole") sections = buildSchoolSections();
	if (role === "enseignant") sections = buildTeacherSections();

	if (sections.length) {
		main.insertAdjacentHTML("beforeend", `<div class="role-sections">${sections.join("")}</div>`);
	}
}

setupRoleDashboard();
