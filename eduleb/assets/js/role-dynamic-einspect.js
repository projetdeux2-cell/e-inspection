function normalizeList(payload) {
	if (Array.isArray(payload)) return payload;
	if (Array.isArray(payload?.data)) return payload.data;
	return [];
}

function safeText(value, fallback = "-") {
	return value === undefined || value === null || value === "" ? fallback : value;
}

function badgeClass(status) {
	const value = String(status).toLowerCase();
	if (value.includes("realisee") || value.includes("signe") || value.includes("actif") || value.includes("success")) return "badge success";
	if (value.includes("confirmee") || value.includes("validation") || value.includes("configurable") || value.includes("info")) return "badge info";
	return "badge warning";
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

function renderRows(items, mapper, emptyText = "Aucune donnee disponible.", emptyColspan = 5) {
	if (!items.length) {
		return [`<tr><td colspan="${emptyColspan}">${emptyText}</td></tr>`];
	}
	return items.map(mapper);
}

async function fetchList(resource, params = {}) {
	if (!window.EducInspectApi?.token) return [];
	try {
		if (resource === "users") {
			return normalizeList(await window.EducInspectApi.adminUsers());
		}
		return normalizeList(await window.EducInspectApi.list(resource, params));
	} catch (error) {
		console.warn(`Impossible de charger ${resource}`, error);
		return [];
	}
}

async function buildAdminSections() {
	return [];
}

function roleLabel(role) {
	const labels = {
		admin: "Admin",
		directeur_departemental: "Directeur départemental",
		inspecteur: "Inspecteur",
		directeur_ecole: "Directeur d'école",
		enseignant: "Enseignant"
	};
	return labels[role] || role || "-";
}

async function loadAdminUsers() {
	const body = document.querySelector("[data-admin-users-body]");
	if (!body || !window.EducInspectApi?.token) return;

	try {
		const users = normalizeList(await window.EducInspectApi.adminUsers());
		body.innerHTML = renderRows(users, (user) => {
			const role = user.roles?.[0]?.name || "";
			return `
				<tr>
					<td><strong>${safeText(user.name)}</strong><span>ID ${user.id}</span></td>
					<td>${safeText(user.email)}</td>
					<td><mark class="badge info">${roleLabel(role)}</mark></td>
					<td><button class="mini-btn" type="button" data-edit-user="${user.id}" data-name="${safeText(user.name)}" data-email="${safeText(user.email)}" data-role="${role}">Modifier</button></td>
				</tr>
			`;
		}).join("");
	} catch (error) {
		body.innerHTML = `<tr><td colspan="4">Impossible de charger les utilisateurs.</td></tr>`;
	}
}

function setupAdminUserForm() {
	const form = document.querySelector("[data-admin-user-form]");
	if (!form) return;
	const message = document.querySelector("[data-admin-user-message]");
	const resetButton = document.querySelector("[data-reset-admin-form]");

	const show = (text, type = "info") => {
		if (!message) return;
		message.textContent = text;
		message.dataset.type = type;
	};

	const reset = () => {
		form.reset();
		form.elements.id.value = "";
		form.elements.password.required = true;
		show("");
	};

	resetButton?.addEventListener("click", reset);

	document.addEventListener("click", (event) => {
		const button = event.target.closest("[data-edit-user]");
		if (!button) return;
		form.elements.id.value = button.dataset.editUser;
		form.elements.name.value = button.dataset.name;
		form.elements.email.value = button.dataset.email;
		form.elements.role.value = button.dataset.role;
		form.elements.password.value = "";
		form.elements.password.required = false;
		show("Modification du compte selectionne.");
		document.querySelector("#utilisateurs")?.scrollIntoView({ behavior: "smooth" });
	});

	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		const payload = {
			name: form.elements.name.value,
			email: form.elements.email.value,
			role: form.elements.role.value
		};
		if (form.elements.password.value) payload.password = form.elements.password.value;

		try {
			show("Enregistrement en cours...");
			if (form.elements.id.value) {
				await window.EducInspectApi.updateAdminUser(form.elements.id.value, payload);
				show("Compte modifie avec succes.", "success");
			} else {
				payload.password = payload.password || "password";
				await window.EducInspectApi.createAdminUser(payload);
				show("Compte cree avec succes.", "success");
			}
			reset();
			await loadAdminUsers();
		} catch (error) {
			show(error.message || "Erreur pendant l'enregistrement.", "error");
		}
	});
}

function formatDate(value) {
	if (!value) return "-";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return safeText(value);
	return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function buildReportHref(reportPath) {
	if (!reportPath) return "";
	if (/^https?:\/\//i.test(reportPath)) return reportPath;
	const apiBase = window.EducInspectApi?.baseUrl?.replace(/\/api\/?$/, "") || window.location.origin || "";
	const origin = apiBase || window.location.origin || "";
	if (reportPath.startsWith("/")) return `${origin}${reportPath}`;
	if (reportPath.startsWith("storage/")) return `${origin}/${reportPath}`;
	if (reportPath.startsWith("public/")) return `${origin}/${reportPath.replace(/^public\//, "storage/")}`;
	return `${origin}/storage/${reportPath}`;
}

function renderDirectionRecommendations(recommendations) {
	const rows = renderRows(recommendations, (item) => {
		const schoolName = safeText(item.inspection?.mission?.school?.name, "École non renseignée");
		const inspectorName = safeText(item.inspection?.mission?.inspector?.user?.name, "Inspecteur");
		const priority = safeText(item.priority, "medium");
		return `
			<tr>
				<td><strong>${safeText(item.description)}</strong></td>
				<td>${schoolName}</td>
				<td>${inspectorName}</td>
				<td><mark class="badge ${priority === 'high' ? 'warning' : priority === 'low' ? 'success' : 'info'}">${priority}</mark></td>
				<td>${formatDate(item.due_date)}</td>
				<td><mark class="${badgeClass(item.status)}">${safeText(item.status)}</mark></td>
			</tr>`;
	}, "Aucune recommandation disponible pour le moment.");
	return tableHtml(["Recommandation", "École", "Inspecteur", "Priorité", "Échéance", "Statut"], rows);
}

function renderDirectionReports(inspections) {
	const rows = renderRows(inspections, (item) => {
		const reportHref = buildReportHref(item.report_path);
		const actionHtml = reportHref
			? `<div class="action-stack"><a class="mini-btn" href="${reportHref}" target="_blank" rel="noopener">Consulter</a><a class="mini-btn" href="${reportHref}" download="rapport-${item.id}.pdf">Télécharger</a></div>`
			: `<span class="muted">PDF indisponible</span>`;
		return `
			<tr>
				<td><strong>${safeText(item.report_path || `Rapport-${item.id}`)}</strong></td>
				<td>${safeText(item.mission?.school?.name)}</td>
				<td>${formatDate(item.inspection_date)}</td>
				<td>${safeText(item.global_score)}%</td>
				<td><mark class="${badgeClass(item.status || 'Signe')}">${safeText(item.status || 'Signe')}</mark></td>
				<td>${actionHtml}</td>
			</tr>`;
	}, "Aucun rapport disponible pour le moment.");
	return tableHtml(["Rapport", "École", "Date", "Score", "Statut", "Action"], rows);
}

async function buildDirectionSections() {
	const [missions, recommendations] = await Promise.all([
		fetchList("missions"),
		fetchList("recommendations")
	]);
	return [
		sectionHtml("calendrier-direction", "Calendrier de suivi", tableHtml(["Ecole", "Date", "Inspecteur", "Statut"], renderRows(missions, (item) =>
			`<tr><td><strong>${safeText(item.school?.name)}</strong><span>${safeText(item.school?.commune?.name)}</span></td><td>${safeText(item.planned_date)}</td><td>${safeText(item.inspector?.user?.name)}</td><td><mark class="${badgeClass(item.status)}">${safeText(item.status)}</mark></td></tr>`
		))),
		sectionHtml("statistiques", "Statistiques direction", `<p>Les indicateurs de couverture, de qualite et de suivi sont charges depuis le backend sur les cartes du tableau de bord.</p>`),
		sectionHtml("recommandations", "Recommandations a superviser", tableHtml(["Action", "Ecole", "Priorite", "Statut"], renderRows(recommendations, (item) =>
			`<tr><td><strong>${safeText(item.description)}</strong></td><td>${safeText(item.inspection?.mission?.school?.name)}</td><td><mark class="badge ${item.priority === 'high' ? 'warning' : item.priority === 'low' ? 'success' : 'info'}">${safeText(item.priority)}</mark></td><td><mark class="${badgeClass(item.status)}">${safeText(item.status)}</mark></td></tr>`
		)))
	];
}

async function setupDirectionDataViews() {
	const recommendationsRoot = document.querySelector("[data-direction-recommendations]");
	const reportsRoot = document.querySelector("[data-direction-reports]");
	if (!recommendationsRoot && !reportsRoot) return;

	try {
		const [recommendations, inspections] = await Promise.all([
			fetchList("recommendations"),
			fetchList("inspections")
		]);
		if (recommendationsRoot) recommendationsRoot.innerHTML = renderDirectionRecommendations(recommendations);
		if (reportsRoot) reportsRoot.innerHTML = renderDirectionReports(inspections);
	} catch (error) {
		if (recommendationsRoot) recommendationsRoot.innerHTML = '<p class="muted">Impossible de charger les recommandations.</p>';
		if (reportsRoot) reportsRoot.innerHTML = '<p class="muted">Impossible de charger les rapports.</p>';
	}
}

async function buildInspectorSections() {
	const [missions, inspections] = await Promise.all([
		fetchList("missions"),
		fetchList("inspections")
	]);
	return [
		sectionHtml("calendrier-inspecteur", "Mes missions", tableHtml(["Ecole", "Date", "Commune", "Statut"], renderRows(missions, (item) =>
			`<tr><td><strong>${safeText(item.school?.name)}</strong></td><td>${safeText(item.planned_date)}</td><td>${safeText(item.school?.commune?.name)}</td><td><mark class="${badgeClass(item.status)}">${safeText(item.status)}</mark></td></tr>`
		))),
		sectionHtml("rapports-inspecteur", "Rapports produits", tableHtml(["Rapport", "Ecole", "Score", "Etat"], renderRows(inspections, (item) =>
			`<tr><td><strong>${safeText(item.report_path || `RIP-${item.id}`)}</strong></td><td>${safeText(item.mission?.school?.name)}</td><td>${safeText(item.global_score)}%</td><td><mark class="${badgeClass(item.status || 'Signe')}">${safeText(item.status || 'Signe')}</mark></td></tr>`
		)))
	];
}

async function buildSchoolSections() {
	const [recommendations, inspections, missions] = await Promise.all([
		fetchList("recommendations"),
		fetchList("inspections"),
		fetchList("missions")
	]);
	return [
		sectionHtml("missions-ecole", "Missions assignées", tableHtml(["Mission", "Inspecteur", "Date", "Statut"], renderRows(missions, (item) =>
			`<tr><td><strong>${safeText(item.objective || "Mission d'inspection")}</strong><span>${safeText(item.school?.name)}</span></td><td>${safeText(item.inspector?.user?.name)}</td><td>${safeText(item.planned_date)}</td><td><mark class="${badgeClass(item.status || "planned")}">${safeText(item.status || "planned")}</mark></td></tr>`
		))),
		sectionHtml("plan-daction", "Plan d'action", tableHtml(["Action", "Responsable", "Echeance", "Statut"], renderRows(recommendations, (item) =>
			`<tr><td><strong>${safeText(item.description)}</strong></td><td>Direction d'ecole</td><td>${safeText(item.due_date)}</td><td><mark class="${badgeClass(item.status)}">${safeText(item.status)}</mark></td></tr>`
		))),
		sectionHtml("observations", "Observations recues", tableHtml(["Observation", "Source", "Statut"], renderRows(inspections, (item) =>
			`<tr><td><strong>${safeText(item.summary || "Observation de l'inspection")}</strong></td><td>${safeText(item.mission?.school?.name)}</td><td><mark class="${badgeClass(item.status || "Signe")}">${safeText(item.status || "Signe")}</mark></td></tr>`
		)))
	];
}

async function buildTeacherSections() {
	const recommendations = await fetchList("recommendations");
	return [
		sectionHtml("observations", "Observations pédagogiques", tableHtml(["Observation", "Classe", "Statut"], renderRows(recommendations, (item) =>
			`<tr><td><strong>${safeText(item.description)}</strong></td><td>CP1</td><td><mark class="${badgeClass(item.status)}">${safeText(item.status)}</mark></td></tr>`
		)))
	];
}

function renderSectionPane(root, headers, rowsHtml) {
	if (!root) return;
	root.innerHTML = tableHtml(headers, rowsHtml);
}

function createSectionSearch(input, items, renderFn) {
	if (!input) return;
	input.addEventListener("input", () => {
		const query = (input.value || "").toLowerCase().trim();
		if (!query) {
			renderFn(items);
			return;
		}
		const filtered = items.filter((item) => JSON.stringify(item).toLowerCase().includes(query));
		renderFn(filtered);
	});
}

async function renderSchoolReportsPage(root) {
	const inspections = await fetchList("inspections");
	const filtered = inspections;
	const render = (list) => {
		const rows = renderRows(list, (item) => {
			const reportHref = buildReportHref(item.report_path);
			const actionHtml = reportHref
				? `<div class="action-stack"><a class="mini-btn" href="${reportHref}" target="_blank" rel="noopener">Voir</a><a class="mini-btn" href="${reportHref}" download="rapport-${item.id}.pdf">Télécharger</a></div>`
				: `<span class="muted">PDF indisponible</span>`;
			return `
				<tr>
					<td><strong>${safeText(item.report_path || `Rapport-${item.id}`)}</strong><span>${safeText(item.mission?.school?.name)}</span></td>
					<td>${formatDate(item.inspection_date)}</td>
					<td>${safeText(item.global_score)}%</td>
					<td><mark class="${badgeClass(item.status || 'Signe')}">${safeText(item.status || 'Signe')}</mark></td>
					<td>${actionHtml}</td>
				</tr>`;
		});
		renderSectionPane(root, ["Rapport", "École", "Date", "Score", "Statut", "Action"], rows);
	};
	render(filtered);
	createSectionSearch(document.querySelector("[data-section-search]"), filtered, render);
}

async function renderSchoolActionPlanPage(root) {
	const recommendations = await fetchList("recommendations");
	const render = (list) => {
		const rows = renderRows(list, (item) => `
			<tr>
				<td><strong>${safeText(item.description)}</strong></td>
				<td>${safeText(item.inspection?.mission?.school?.name)}</td>
				<td>${formatDate(item.due_date)}</td>
				<td><mark class="badge ${item.priority === 'high' ? 'warning' : item.priority === 'low' ? 'success' : 'info'}">${safeText(item.priority)}</mark></td>
				<td><mark class="${badgeClass(item.status)}">${safeText(item.status)}</mark></td>
			</tr>`);
		renderSectionPane(root, ["Action", "École", "Échéance", "Priorité", "Statut"], rows);
	};
	render(recommendations);
	createSectionSearch(document.querySelector("[data-section-search]"), recommendations, render);
}

async function renderSchoolObservationsPage(root) {
	const inspections = await fetchList("inspections");
	const render = (list) => {
		const rows = renderRows(list, (item) => `
			<tr>
				<td><strong>${safeText(item.summary || 'Observation enregistrée')}</strong></td>
				<td>${safeText(item.mission?.school?.name)}</td>
				<td>${formatDate(item.inspection_date)}</td>
				<td><mark class="${badgeClass(item.status || 'Signe')}">${safeText(item.status || 'Signe')}</mark></td>
			</tr>`);
		renderSectionPane(root, ["Observation", "École", "Date", "Statut"], rows);
	};
	render(inspections);
	createSectionSearch(document.querySelector("[data-section-search]"), inspections, render);
}

async function renderSchoolRecommendationsPage(root) {
	const recommendations = await fetchList("recommendations");
	const render = (list) => {
		const rows = renderRows(list, (item) => `
			<tr>
				<td><strong>${safeText(item.description)}</strong></td>
				<td>${safeText(item.inspection?.mission?.school?.name)}</td>
				<td>${formatDate(item.due_date)}</td>
				<td><mark class="${badgeClass(item.status)}">${safeText(item.status)}</mark></td>
			</tr>`);
		renderSectionPane(root, ["Recommandation", "École", "Échéance", "Statut"], rows);
	};
	render(recommendations);
	createSectionSearch(document.querySelector("[data-section-search]"), recommendations, render);
}

async function renderSchoolCalendarPage(root) {
	const [missions, inspections] = await Promise.all([fetchList("missions"), fetchList("inspections")]);
	const events = [...missions.map((item) => ({
		date: item.planned_date,
		school: item.school?.name,
		type: "Mission",
		status: item.status
	})), ...inspections.map((item) => ({
		date: item.inspection_date,
		school: item.mission?.school?.name,
		type: "Inspection",
		status: item.status || 'Signe'
	}))].sort((a, b) => new Date(a.date) - new Date(b.date));
	const render = (list) => {
		const rows = renderRows(list, (item) => `
			<tr>
				<td>${formatDate(item.date)}</td>
				<td>${safeText(item.school)}</td>
				<td>${safeText(item.type)}</td>
				<td><mark class="${badgeClass(item.status)}">${safeText(item.status)}</mark></td>
			</tr>`);
		renderSectionPane(root, ["Date", "École", "Type", "Statut"], rows);
	};
	render(events);
	createSectionSearch(document.querySelector("[data-section-search]"), events, render);
}

async function renderSchoolTeachersPage(root) {
	const user = (typeof getCurrentUser === 'function') ? getCurrentUser() : JSON.parse(localStorage.getItem('educinspect_user') || '{}');
	let teachers = [];
	try {
		let schoolId = null;
		if (user?.id) {
			let schools = await fetchList('schools', { user_id: user.id });
			let list = Array.isArray(schools) ? schools : normalizeList(schools);
			// fallback to fetch all and filter locally if server filter not supported
			if ((!list || !list.length) && window.EducInspectApi?.list) {
				try {
					const all = normalizeList(await window.EducInspectApi.list('schools'));
					list = all.filter((s) => (s.user_id && String(s.user_id) === String(user.id)) || (s.user && s.user.id && String(s.user.id) === String(user.id)));
				} catch (e) {
					console.warn('Fallback fetching all schools failed', e);
				}
			}
			if (list && list.length) schoolId = list[0].id;
		}
		if (schoolId) {
			teachers = await fetchList('teachers', { school_id: schoolId });
		} else {
			// No school linked to current user: show empty list (do not expose all teachers)
			teachers = [];
		}
	} catch (e) {
		console.warn('Erreur lors du chargement des enseignants pour cette école', e);
		teachers = await fetchList('teachers');
	}

	const render = (list) => {
		const rows = renderRows(list, (item) => `
			<tr>
				<td><strong>${safeText(item.name)}</strong><span>Classe ${safeText(item.grade)}</span></td>
				<td>${safeText(item.school?.name)}</td>
				<td>${safeText(item.email)}</td>
				<td>${safeText(item.phone)}</td>
				<td>
					<a class="mini-btn" href="ajouter-enseignant.html?id=${item.id}">Modifier</a>
					<button class="mini-btn" type="button" data-teacher-delete="${item.id}">Supprimer</button>
				</td>
			</tr>`,
			"Aucun enseignant trouvé.",
			5);
		renderSectionPane(root, ["Enseignant", "École", "Email", "Téléphone", "Action"], rows);
	};
	render(teachers);
	createSectionSearch(document.querySelector("[data-section-search]"), teachers, render);

	document.addEventListener('click', async (event) => {
		const deleteButton = event.target.closest('[data-teacher-delete]');
		if (!deleteButton) return;
		const teacherId = deleteButton.dataset.teacherDelete;
		const confirmed = window.confirm('Voulez-vous supprimer cet enseignant ?');
		if (!confirmed) return;
		try {
			await window.EducInspectApi.deleteResource('teachers', teacherId);
			render(await fetchList('teachers'));
		} catch (error) {
			window.alert(error.message || 'Impossible de supprimer l\'enseignant.');
		}
	});
}

async function renderValidateTeachersPage(root) {
	const teachers = await fetchList("teachers");
	const render = (list) => {
		const rows = renderRows(list, (item) => {
			const status = item.email ? 'Validé' : 'À valider';
			return `
				<tr>
					<td><strong>${safeText(item.name)}</strong></td>
					<td>${safeText(item.school?.name)}</td>
					<td>${safeText(item.subject)}</td>
					<td>${safeText(item.email)}</td>
					<td><mark class="badge ${item.email ? 'success' : 'warning'}">${status}</mark></td>
				</tr>`;
		});
		renderSectionPane(root, ["Enseignant", "École", "Matière", "Email", "Statut"], rows);
	};
	render(teachers);
	createSectionSearch(document.querySelector("[data-section-search]"), teachers, render);
}

async function renderTeacherReportsPage(root) {
	const inspections = await fetchList("inspections");
	const render = (list) => {
		const rows = renderRows(list, (item) => `
			<tr>
				<td><strong>${safeText(item.report_path || `Rapport-${item.id}`)}</strong></td>
				<td>${safeText(item.mission?.school?.name)}</td>
				<td>${formatDate(item.inspection_date)}</td>
				<td>${safeText(item.global_score)}%</td>
				<td><mark class="${badgeClass(item.status || 'Signe')}">${safeText(item.status || 'Signe')}</mark></td>
			</tr>`);
		renderSectionPane(root, ["Rapport", "École", "Date", "Score", "Statut"], rows);
	};
	render(inspections);
	createSectionSearch(document.querySelector("[data-section-search]"), inspections, render);
}

async function renderTeacherObservationsPage(root) {
	const inspections = await fetchList("inspections");
	const render = (list) => {
		const rows = renderRows(list, (item) => `
			<tr>
				<td><strong>${safeText(item.summary || 'Observation enregistrée')}</strong></td>
				<td>${safeText(item.mission?.school?.name)}</td>
				<td>${formatDate(item.inspection_date)}</td>
				<td><mark class="${badgeClass(item.status || 'Signe')}">${safeText(item.status || 'Signe')}</mark></td>
			</tr>`);
		renderSectionPane(root, ["Observation", "École", "Date", "Statut"], rows);
	};
	render(inspections);
	createSectionSearch(document.querySelector("[data-section-search]"), inspections, render);
}

async function renderTeacherActionsPage(root) {
	const recommendations = await fetchList("recommendations");
	const render = (list) => {
		const rows = renderRows(list, (item) => `
			<tr>
				<td><strong>${safeText(item.description)}</strong></td>
				<td>${safeText(item.inspection?.mission?.school?.name)}</td>
				<td>${formatDate(item.due_date)}</td>
				<td><mark class="${badgeClass(item.status)}">${safeText(item.status)}</mark></td>
			</tr>`);
		renderSectionPane(root, ["Action", "École", "Échéance", "Statut"], rows);
	};
	render(recommendations);
	createSectionSearch(document.querySelector("[data-section-search]"), recommendations, render);
}

async function setupSectionPages() {
	const page = window.location.pathname.split("/").pop();
	const root = document.querySelector("[data-section-content]");
	if (!root) return;
	const renderers = {
		"ecole-rapports.html": renderSchoolReportsPage,
		"ecole-plan-daction.html": renderSchoolActionPlanPage,
		"ecole-observations.html": renderSchoolObservationsPage,
		"ecole-recommandations.html": renderSchoolRecommendationsPage,
		"ecole-calendrier.html": renderSchoolCalendarPage,
		"ecole-enseignants.html": renderSchoolTeachersPage,
		"valider-enseignants.html": renderValidateTeachersPage,
		"enseignant-rapport.html": renderTeacherReportsPage,
		"enseignant-observation.html": renderTeacherObservationsPage,
		"enseignant-Actions-pedagogiques.html": renderTeacherActionsPage
	};
	const renderer = renderers[page];
	if (renderer) {
		await renderer(root);
	}
}

function fixMenuLinks(role) {
	const map = {
		admin: {
			"Dashboard admin": "admin.html",
			"Utilisateurs": "admin-utilisateurs.html",
			"Roles et permissions": "admin-roles.html",
			"Departements": "admin-departements.html",
			"Communes": "admin-communes.html",
			"Ecoles": "admin-ecoles.html",
			"Inspecteurs": "admin-inspecteurs.html",
			"Parametres": "admin-parametres.html",
			"Paramètres": "admin-parametres.html",
			"Deconnexion": "deconnexion.html"
		},
		directeur_departemental: {
			"Calendrier": "calendrier-direction.html",
			"Rapports": "consultation-rapports.html",
			"Statistiques": "statistiques-direction.html",
			"Recommandations": "recommandations-direction.html",
			"Parametres": "profile.html",
			"Paramètres": "profile.html",
			"Deconnexion": "deconnexion.html"
		},
		inspecteur: {
			"Missions": "missions-inspecteur.html",
			"Calendrier": "calendrier-inspecteur.html",
			"Fiches": "fiches-inspecteur.html",
			"Rapports": "rapports-inspecteur.html",
			"Parametres": "profile.html",
			"Paramètres": "profile.html",
			"Deconnexion": "deconnexion.html"
		},
		directeur_ecole: {
			"Rapports": "ecole-rapports.html",
			"Plan d'action": "ecole-plan-daction.html",
			"Observations": "ecole-observations.html",
			"Créer un enseignant": "ajouter-enseignant.html",
			"Recommandations": "ecole-recommandations.html",
			"Calendrier": "ecole-calendrier.html",
			"Équipe": "ecole-enseignants.html",
			"Parametres": "profile.html",
			"Paramètres": "profile.html",
			"Deconnexion": "deconnexion.html"
		},
		enseignant: {
			"Rapports": "enseignant-rapport.html",
			"Observations": "enseignant-observation.html",
			"Actions pedagogiques": "enseignant-Actions-pedagogiques.html",
			"Parametres": "profile.html",
			"Paramètres": "profile.html",
			"Deconnexion": "deconnexion.html"
		}
	};

	const links = map[role] || {};
	document.querySelectorAll('.side-nav a').forEach((link) => {
		const text = link.textContent.trim();
		if (links[text]) {
			link.href = links[text];
		}
	});
}

function setActiveMenuItem() {
	const currentPage = window.location.pathname.split("/").pop();
	document.querySelectorAll(".side-nav a").forEach((link) => {
		const href = link.getAttribute("href");
		if (!href) return;
		if (href === currentPage) {
			link.classList.add("active");
		} else {
			link.classList.remove("active");
		}
	});
}

function resourceTitle(resource) {
	const titles = {
		users: "Utilisateurs",
		departments: "Departements",
		communes: "Communes",
		schools: "Ecoles",
		inspectors: "Inspecteurs",
		roles: "Roles et permissions",
		settings: "Parametres"
	};
	return titles[resource] || resource;
}

function resourceTableHeaders(resource) {
	const headers = {
		users: ["#", "Nom", "Email", "Role", "Action"],
		departments: ["#", "Departement", "Code", "Chef-lieu", "Action"],
		communes: ["#", "Commune", "Code", "Departement", "Action"],
		schools: ["#", "Ecole", "Commune", "Directeur / Compte", "Effectif", "Action"],
		inspectors: ["#", "Inspecteur", "Matricule", "Specialite", "Telephone", "Action"]
	};
	return headers[resource] || ["#", "Nom", "Action"];
}

function getResourceFields(resource) {
	const fields = {
		users: [
			{ name: "name", label: "Nom complet", type: "text", required: true },
			{ name: "email", label: "Email", type: "email", required: true },
			{ name: "password", label: "Mot de passe", type: "password", required: true },
			{ name: "role", label: "Role", type: "select", required: true, options: [
				{ value: "admin", text: "Admin" },
				{ value: "directeur_departemental", text: "Direction departementale" },
				{ value: "inspecteur", text: "Inspecteur" },
				{ value: "directeur_ecole", text: "Direction d'ecole" },
				{ value: "enseignant", text: "Enseignant" }
			] }
		],
		departments: [
			{ name: "name", label: "Nom du departement", type: "text", required: true },
			{ name: "code", label: "Code", type: "text", required: true },
			{ name: "capital", label: "Chef-lieu", type: "text", required: true }
		],
		communes: [
			{ name: "department_id", label: "Departement", type: "select", required: true },
			{ name: "name", label: "Nom de la commune", type: "text", required: true },
			{ name: "code", label: "Code", type: "text", required: true }
		],
		schools: [
			{ name: "commune_id", label: "Commune", type: "select", required: true },
			{ name: "name", label: "Nom de l'ecole", type: "text", required: true },
			{ name: "code", label: "Code", type: "text", required: true },
			{ name: "director_name", label: "Directeur", type: "text", required: false },
			{ name: "user_id", label: "Compte utilisateur", type: "select", required: false },
			{ name: "phone", label: "Telephone", type: "text", required: false },
			{ name: "email", label: "Email", type: "email", required: false },
			{ name: "student_count", label: "Effectif", type: "number", required: false }
		],
		inspectors: [
			{ name: "user_id", label: "Compte utilisateur", type: "select", required: true },
			{ name: "registration_number", label: "Matricule", type: "text", required: true },
			{ name: "specialty", label: "Specialite", type: "text", required: false },
			{ name: "phone", label: "Telephone", type: "text", required: false }
		]
	};
	return fields[resource] || [];
}

function resourceFormHtml(resource) {
	const createUrls = {
		users: "ajouter-utilisateur.html",
		departments: "ajouter-departement.html",
		communes: "ajouter-commune.html",
		schools: "ajouter-ecole.html",
		inspectors: "ajouter-inspecteur.html"
	};

	const createLabels = {
		users: "utilisateur",
		departments: "département",
		communes: "commune",
		schools: "école",
		inspectors: "inspecteur"
	};

	const createArticles = {
		users: "un",
		departments: "un",
		communes: "une",
		schools: "une",
		inspectors: "un"
	};

	const href = createUrls[resource] || "#";
	const label = createLabels[resource] || resourceTitle(resource);
	const article = createArticles[resource] || "un";

	return `
		<div class="resource-header">
			<p>Utilisez le bouton ci-dessous pour accéder au formulaire de création de ${label}.</p>
			<a class="mini-btn" href="${href}">Ajouter ${article} ${label}</a>
		</div>
	`;
}

function renderResourceTable(resource, items) {
	const rows = {
		users: items.map((user, index) => {
			const role = user.roles?.[0]?.name || "";
			return `<tr>
				<td>${index + 1}</td>
				<td><strong>${safeText(user.name)}</strong><span>${safeText(user.email)}</span></td>
				<td>${safeText(user.email)}</td>
				<td><mark class="badge info">${roleLabel(role)}</mark></td>
				<td>
					<a class="mini-btn" href="ajouter-utilisateur.html?id=${user.id}">Modifier</a>
					<button class="mini-btn" type="button" data-delete-resource="${resource}" data-id="${user.id}">Supprimer</button>
				</td>
			</tr>`;
		}),
		departments: items.map((item, index) => `<tr>
			<td>${index + 1}</td>
			<td><strong>${safeText(item.name)}</strong></td>
			<td>${safeText(item.code)}</td>
			<td>${safeText(item.capital)}</td>
			<td><a class="mini-btn" href="ajouter-departement.html?id=${item.id}">Modifier</a>
			<button class="mini-btn" type="button" data-delete-resource="${resource}" data-id="${item.id}">Supprimer</button></td>
		</tr>`),
		communes: items.map((item, index) => `<tr>
			<td>${index + 1}</td>
			<td><strong>${safeText(item.name)}</strong></td>
			<td>${safeText(item.code)}</td>
			<td>${safeText(item.department?.name)}</td>
			<td><a class="mini-btn" href="ajouter-commune.html?id=${item.id}">Modifier</a>
			<button class="mini-btn" type="button" data-delete-resource="${resource}" data-id="${item.id}">Supprimer</button></td>
		</tr>`),
		schools: items.map((item, index) => `<tr>
			<td>${index + 1}</td>
			<td><strong>${safeText(item.name)}</strong><span>${safeText(item.code)}</span></td>
			<td>${safeText(item.commune?.name)}</td>
			<td>${safeText(item.director_name)}${item.user || item.user_id ? `<span class="sub">${item.user ? safeText(item.user.name) : `Compte #${safeText(item.user_id)}`}${item.user?.email ? ` (${safeText(item.user.email)})` : ""}</span>` : ""}</td>
			<td>${safeText(item.student_count)}</td>
			<td><a class="mini-btn" href="ajouter-ecole.html?id=${item.id}">Modifier</a>
			<button class="mini-btn" type="button" data-delete-resource="${resource}" data-id="${item.id}">Supprimer</button></td>
		</tr>`),
		inspectors: items.map((item, index) => `<tr>
			<td>${index + 1}</td>
			<td><strong>${safeText(item.user?.name)}</strong><span>${safeText(item.user?.email)}</span></td>
			<td>${safeText(item.registration_number)}</td>
			<td>${safeText(item.specialty)}</td>
			<td>${safeText(item.phone)}</td>
			<td><a class="mini-btn" href="ajouter-inspecteur.html?id=${item.id}">Modifier</a>
			<button class="mini-btn" type="button" data-delete-resource="${resource}" data-id="${item.id}">Supprimer</button></td>
		</tr>`)
	};
	return rows[resource] || [];
}

async function buildAdminResourcePage() {
	const resource = document.body.dataset.resource;
	if (!resource) return "";
	const title = resourceTitle(resource);
	const headers = resourceTableHeaders(resource);
	return sectionHtml(resource, title, `
		<div class="table-scroll">
			${tableHtml(headers, [`<tr><td colspan="${headers.length}">Chargement...</td></tr>`]).replace("<tbody>", `<tbody data-admin-resource-body="${resource}">`)}
		</div>
	`);
}

async function loadAdminResourceRows(resource) {
	const body = document.querySelector(`[data-admin-resource-body="${resource}"]`);
	if (!body) return;
	try {
		let items = [];
		if (resource === "users") {
			items = normalizeList(await window.EducInspectApi.adminUsers());
		} else {
			items = normalizeList(await window.EducInspectApi.list(resource));
		}
		body.innerHTML = renderResourceTable(resource, items).join("");
		await loadResourceSelectOptions(resource);
	} catch (error) {
		body.innerHTML = `<tr><td colspan="${resourceTableHeaders(resource).length}">Impossible de charger les donnees.</td></tr>`;
	}
}

async function loadResourceSelectOptions(resource) {
	const form = document.querySelector(`[data-admin-resource-form="${resource}"]`);
	if (!form) return;
	const selectMap = {
		communes: { endpoint: "departments", field: "department_id" },
		schools: { endpoint: "communes", field: "commune_id" },
		inspectors: { endpoint: "users", field: "user_id" }
	};
	const config = selectMap[resource];
	if (!config) return;
	const select = form.querySelector(`[name="${config.field}"]`);
	if (!select) return;
	try {
		let data = [];
		if (config.endpoint === "users") data = normalizeList(await window.EducInspectApi.adminUsers());
		else data = normalizeList(await window.EducInspectApi.list(config.endpoint));
		select.innerHTML = data.map((item) => {
			if (config.endpoint === "departments") return `<option value="${item.id}">${safeText(item.name)}</option>`;
			if (config.endpoint === "communes") return `<option value="${item.id}">${safeText(item.name)}</option>`;
			return `<option value="${item.id}">${safeText(item.name)}</option>`;
		}).join("");
	} catch (error) {
		select.innerHTML = `<option value="">Erreur de chargement</option>`;
	}
}

function setupAdminResourceForm(resource) {
	const form = document.querySelector(`[data-admin-resource-form="${resource}"]`);
	const message = document.querySelector(`[data-admin-resource-message]`);
	const resetButton = form ? form.querySelector("[data-reset-resource-form]") : null;
	const show = (text, type = "info") => { if (!message) return; message.textContent = text; message.dataset.type = type; };
	const reset = () => {
		if (!form) return;
		form.reset();
		form.elements.id.value = "";
		if (resource === "users") form.elements.password.required = true;
		show("");
	};
	resetButton?.addEventListener("click", reset);

	document.addEventListener("click", async (event) => {
		const editButton = event.target.closest("[data-edit-resource]");
		if (editButton) {
			if (!form) return;
			const targetResource = editButton.dataset.editResource;
			if (targetResource !== resource) return;
			form.elements.id.value = editButton.dataset.id || "";
			for (const [key, value] of Object.entries(editButton.dataset)) {
				if (key === "id" || key === "editResource") continue;
				const field = form.elements.namedItem(key.replace(/([A-Z])/g, "-$1").toLowerCase());
				if (field) field.value = value;
			}
			if (resource === "users") form.elements.password.required = false;
			show("Modification du compte selectionne.");
			form.scrollIntoView({ behavior: "smooth" });
			return;
		}

		const deleteButton = event.target.closest("[data-delete-resource]");
		if (deleteButton && deleteButton.dataset.deleteResource === resource) {
			const confirmed = window.confirm("Voulez-vous supprimer cet élément ?");
			if (!confirmed) return;
			try {
				if (resource === "users") {
					await window.EducInspectApi.deleteAdminUser(deleteButton.dataset.id);
				} else {
					await window.EducInspectApi.deleteResource(resource, deleteButton.dataset.id);
				}
				show("Élément supprimé avec succès.", "success");
				await loadAdminResourceRows(resource);
			} catch (error) {
				show(error.message || "Erreur pendant la suppression.", "error");
			}
		}
	});

	form?.addEventListener("submit", async (event) => {
		event.preventDefault();
		const payload = Object.fromEntries(new FormData(form).entries());
		if (resource === "users" && !payload.password && form.elements.id.value) delete payload.password;
		if (resource === "users" && !payload.password && !form.elements.id.value) payload.password = "password";
		try {
			show("Enregistrement en cours...");
			if (form.elements.id.value) {
				if (resource === "users") {
					await window.EducInspectApi.updateAdminUser(form.elements.id.value, payload);
				} else {
					await window.EducInspectApi.updateResource(resource, form.elements.id.value, payload);
				}
				show("Élément modifié avec succès.", "success");
			} else {
				if (resource === "users") {
					await window.EducInspectApi.createAdminUser(payload);
				} else {
					await window.EducInspectApi.createResource(resource, payload);
				}
				show("Élément créé avec succès.", "success");
			}
			reset();
			await loadAdminResourceRows(resource);
		} catch (error) {
			show(error.message || "Erreur pendant l'enregistrement.", "error");
		}
	});
}

async function setupRoleDashboard() {
	const role = document.body.dataset.requiredRole;
	const resource = document.body.dataset.resource;
	const main = document.querySelector(".main");
	if (!role || !main) return;

	fixMenuLinks(role);
	setActiveMenuItem();

	const page = window.location.pathname.split("/").pop();
	const dashboardPages = [
		"admin.html",
		"direction.html",
		"inspecteur.html",
		"ecole.html",
		"enseignant.html"
	];

	let sections = [];
	if (resource) {
		if (!document.querySelector(`[data-admin-resource-body="${resource}"]`)) {
			sections = [await buildAdminResourcePage()];
		}
	} else if (dashboardPages.includes(page) && document.body.dataset.dynamicSections !== "false") {
		if (role === "admin") {
			sections = await buildAdminSections();
		} else if (role === "directeur_departemental") {
			sections = await buildDirectionSections();
		} else if (role === "inspecteur") {
			sections = await buildInspectorSections();
		} else if (role === "directeur_ecole") {
			sections = await buildSchoolSections();
		} else if (role === "enseignant") {
			sections = await buildTeacherSections();
		}
	}

	if (sections.length) {
		main.insertAdjacentHTML("beforeend", `<div class="role-sections">${sections.join("")}</div>`);
	}

	await setupDirectionDataViews();
	await setupSectionPages();

	if (resource) {
		setupAdminResourceForm(resource);
		await loadAdminResourceRows(resource);
	}
}

setupRoleDashboard();
