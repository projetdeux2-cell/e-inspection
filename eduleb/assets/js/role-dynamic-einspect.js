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

function renderRows(items, mapper, emptyText = "Aucune donnee disponible.") {
	if (!items.length) {
		return [`<tr><td colspan="5">${emptyText}</td></tr>`];
	}
	return items.map(mapper);
}

async function fetchList(resource) {
	if (!window.EducInspectApi?.token) return [];
	try {
		if (resource === "users") {
			return normalizeList(await window.EducInspectApi.adminUsers());
		}
		return normalizeList(await window.EducInspectApi.list(resource));
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
		directeur_departemental: "Direction",
		inspecteur: "Inspecteur",
		directeur_ecole: "Ecole",
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

async function buildInspectorSections() {
	const [missions, inspections] = await Promise.all([
		fetchList("missions"),
		fetchList("inspections")
	]);
	return [
		sectionHtml("calendrier-inspecteur", "Mon calendrier", tableHtml(["Ecole", "Date", "Commune", "Statut"], renderRows(missions, (item) =>
			`<tr><td><strong>${safeText(item.school?.name)}</strong></td><td>${safeText(item.planned_date)}</td><td>${safeText(item.school?.commune?.name)}</td><td><mark class="${badgeClass(item.status)}">${safeText(item.status)}</mark></td></tr>`
		))),
		sectionHtml("fiches-inspecteur", "Fiches d'inspection", `<p>Zone de remplissage des fiches numeriques de l'inspecteur. Les notes et observations seront sauvegardees par l'API inspections/evaluations.</p>`),
		sectionHtml("rapports-inspecteur", "Rapports produits", tableHtml(["Rapport", "Ecole", "Score", "Etat"], renderRows(inspections, (item) =>
			`<tr><td><strong>${safeText(item.report_path || `RIP-${item.id}`)}</strong></td><td>${safeText(item.mission?.school?.name)}</td><td>${safeText(item.global_score)}%</td><td><mark class="${badgeClass(item.status || 'Signe')}">${safeText(item.status || 'Signe')}</mark></td></tr>`
		)))
	];
}

async function buildSchoolSections() {
	const [recommendations, inspections] = await Promise.all([
		fetchList("recommendations"),
		fetchList("inspections")
	]);
	return [
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
		sectionHtml("observations", "Observations pedagogiques", tableHtml(["Observation", "Classe", "Statut"], renderRows(recommendations, (item) =>
			`<tr><td><strong>${safeText(item.description)}</strong></td><td>CP1</td><td><mark class="${badgeClass(item.status)}">${safeText(item.status)}</mark></td></tr>`
		))),
		sectionHtml("actions-pedagogiques", "Actions pedagogiques", `<p>Ces actions concernent uniquement l'enseignant connecte et son suivi de classe.</p>`)
	];
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
			"Deconnexion": "deconnexion.html"
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
		if (links[text]) link.href = links[text];
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
		users: ["Nom", "Email", "Role", "Statut", "Action"],
		departments: ["Departement", "Code", "Chef-lieu", "Action"],
		communes: ["Commune", "Code", "Departement", "Action"],
		schools: ["Ecole", "Commune", "Directeur", "Effectif", "Action"],
		inspectors: ["Inspecteur", "Matricule", "Specialite", "Telephone", "Action"]
	};
	return headers[resource] || ["Nom", "Action"];
}

function resourceActionLabel(resource) {
	const labels = {
		users: "Ajouter un utilisateur",
		departments: "Ajouter un departement",
		communes: "Ajouter une commune",
		schools: "Ajouter une ecole",
		inspectors: "Ajouter un inspecteur"
	};
	return labels[resource] || "Ajouter";
}

function resourceToolbarHtml(resource) {
	if (resource === "users") return "";
	const addPages = {
		departments: "ajouter-departement.html",
		communes: "ajouter-commune.html",
		schools: "ajouter-ecole.html"
	};
	const addButton = resource === "inspectors"
		? ""
		: `<a class="resource-add-btn" href="${addPages[resource] || "#"}">
				<span class="ti-plus"></span>
				${resourceActionLabel(resource)}
			</a>`;
	return `
		<div class="resource-toolbar">
			<div class="resource-search-box">
				<span class="ti-search"></span>
				<input type="search" data-resource-search-input="${resource}" placeholder="Rechercher dans la liste...">
			</div>
			${addButton}
		</div>
	`;
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
	const fields = getResourceFields(resource);
	const fieldHtml = fields.map((field) => {
		const required = field.required ? "required" : "";
		if (field.type === "select") {
			const options = field.options ? field.options.map((option) => `<option value="${option.value}">${option.text}</option>`).join("") : `<option value="">Chargement...</option>`;
			return `<label>${field.label}<select name="${field.name}" ${required}>${options}</select></label>`;
		}
		return `<label>${field.label}<input name="${field.name}" type="${field.type}" ${required}></label>`;
	}).join("");
	return `
		<form class="app-form admin-resource-form" data-admin-resource-form="${resource}">
			<input type="hidden" name="id">
			${fieldHtml}
			<div class="form-actions">
				<button class="primary-action" type="submit">Enregistrer</button>
				<button class="secondary-action" type="button" data-reset-resource-form>Annuler</button>
			</div>
			<p class="form-message" data-admin-resource-message></p>
		</form>
	`;
}

function renderResourceTable(resource, items) {
	const rows = {
		users: items.map((user) => {
			const role = user.roles?.[0]?.name || "";
			const isActive = Boolean(user.email_verified_at);
			const statusLabel = isActive ? "Actif" : "Inactif";
			const statusClass = isActive ? "success" : "warning";
			return `<tr>
				<td><strong>${safeText(user.name)}</strong><span>${safeText(user.email)}</span></td>
				<td>${safeText(user.email)}</td>
				<td><mark class="badge info">${roleLabel(role)}</mark></td>
				<td><mark class="badge ${statusClass}">${statusLabel}</mark></td>
				<td>
					<button class="mini-btn" type="button" data-edit-resource="${resource}" data-id="${user.id}" data-name="${safeText(user.name)}" data-email="${safeText(user.email)}" data-role="${role}">Modifier</button>
					<button class="mini-btn" type="button" data-delete-resource="${resource}" data-id="${user.id}">Supprimer</button>
				</td>
			</tr>`;
		}),
		departments: items.map((item) => `<tr>
			<td><strong>${safeText(item.name)}</strong></td>
			<td>${safeText(item.code)}</td>
			<td>${safeText(item.capital)}</td>
			<td><button class="mini-btn" type="button" data-edit-resource="${resource}" data-id="${item.id}" data-name="${safeText(item.name)}" data-code="${safeText(item.code)}" data-capital="${safeText(item.capital)}">Modifier</button>
			<button class="mini-btn" type="button" data-delete-resource="${resource}" data-id="${item.id}">Supprimer</button></td>
		</tr>`),
		communes: items.map((item) => `<tr>
			<td><strong>${safeText(item.name)}</strong></td>
			<td>${safeText(item.code)}</td>
			<td>${safeText(item.department?.name)}</td>
			<td><button class="mini-btn" type="button" data-edit-resource="${resource}" data-id="${item.id}" data-department-id="${item.department_id}" data-name="${safeText(item.name)}" data-code="${safeText(item.code)}">Modifier</button>
			<button class="mini-btn" type="button" data-delete-resource="${resource}" data-id="${item.id}">Supprimer</button></td>
		</tr>`),
		schools: items.map((item) => `<tr>
			<td><strong>${safeText(item.name)}</strong><span>${safeText(item.code)}</span></td>
			<td>${safeText(item.commune?.name)}</td>
			<td>${safeText(item.director_name)}</td>
			<td>${safeText(item.student_count)}</td>
			<td><button class="mini-btn" type="button" data-edit-resource="${resource}" data-id="${item.id}" data-commune-id="${item.commune_id}" data-name="${safeText(item.name)}" data-code="${safeText(item.code)}" data-director-name="${safeText(item.director_name)}" data-phone="${safeText(item.phone)}" data-email="${safeText(item.email)}" data-student-count="${safeText(item.student_count)}">Modifier</button>
			<button class="mini-btn" type="button" data-delete-resource="${resource}" data-id="${item.id}">Supprimer</button></td>
		</tr>`),
		inspectors: items.map((item) => `<tr>
			<td><strong>${safeText(item.user?.name)}</strong><span>${safeText(item.user?.email)}</span></td>
			<td>${safeText(item.registration_number)}</td>
			<td>${safeText(item.specialty)}</td>
			<td>${safeText(item.phone)}</td>
			<td><button class="mini-btn" type="button" data-edit-resource="${resource}" data-id="${item.id}" data-user-id="${item.user_id}" data-registration-number="${safeText(item.registration_number)}" data-specialty="${safeText(item.specialty)}" data-phone="${safeText(item.phone)}">Modifier</button>
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
	if (resource === "users") {
		return sectionHtml(resource, title, `
			<div class="table-scroll">
				${tableHtml(headers, [`<tr><td colspan="${headers.length}">Chargement...</td></tr>`]).replace("<tbody>", `<tbody data-admin-resource-body="${resource}">`)}
			</div>
		`);
	}
	return sectionHtml(resource, title, `
		${resourceToolbarHtml(resource)}
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

function setupAdminResourceActions(resource) {
	document.addEventListener("click", async (event) => {
		const editButton = event.target.closest("[data-edit-resource]");
		if (editButton && editButton.dataset.editResource === resource && resource === "users") {
			const name = window.prompt("Nom complet", editButton.dataset.name || "");
			if (name === null) return;
			const email = window.prompt("Email", editButton.dataset.email || "");
			if (email === null) return;
			const role = window.prompt("Rôle", editButton.dataset.role || "");
			if (role === null) return;
			try {
				await window.EducInspectApi.updateAdminUser(editButton.dataset.id, {
					name,
					email,
					role
				});
				await loadAdminResourceRows(resource);
			} catch (error) {
				window.alert(error.message || "Erreur pendant la modification.");
			}
			return;
		}

		const deleteButton = event.target.closest("[data-delete-resource]");
		if (deleteButton && deleteButton.dataset.deleteResource === resource) {
			const confirmed = window.confirm("Voulez-vous supprimer cet element ?");
			if (!confirmed) return;
			try {
				if (resource === "users") {
					await window.EducInspectApi.deleteAdminUser(deleteButton.dataset.id);
				} else {
					await window.EducInspectApi.deleteResource(resource, deleteButton.dataset.id);
				}
				await loadAdminResourceRows(resource);
			} catch (error) {
				window.alert(error.message || "Erreur pendant la suppression.");
			}
		}
	});
}

function setupAdminResourceForm(resource) {
	const form = document.querySelector(`[data-admin-resource-form="${resource}"]`);
	if (!form) return;
	const message = document.querySelector(`[data-admin-resource-message]`);
	const resetButton = form.querySelector("[data-reset-resource-form]");
	const show = (text, type = "info") => { if (!message) return; message.textContent = text; message.dataset.type = type; };
	const reset = () => { form.reset(); form.elements.id.value = ""; if (resource === "users") form.elements.password.required = true; show(""); };
	resetButton?.addEventListener("click", reset);

	document.addEventListener("click", async (event) => {
		const editButton = event.target.closest("[data-edit-resource]");
		if (editButton) {
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
			const confirmed = window.confirm("Voulez-vous supprimer cet element ?");
			if (!confirmed) return;
			try {
				if (resource === "users") {
					await window.EducInspectApi.deleteAdminUser(deleteButton.dataset.id);
				} else {
					await window.EducInspectApi.deleteResource(resource, deleteButton.dataset.id);
				}
				show("Element supprime avec succes.", "success");
				await loadAdminResourceRows(resource);
			} catch (error) {
				show(error.message || "Erreur pendant la suppression.", "error");
			}
		}
	});

	form.addEventListener("submit", async (event) => {
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
				show("Element modifie avec succes.", "success");
			} else {
				if (resource === "users") {
					await window.EducInspectApi.createAdminUser(payload);
				} else {
					await window.EducInspectApi.createResource(resource, payload);
				}
				show("Element cree avec succes.", "success");
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
	const main = document.querySelector(".main");
	if (!role || !main) return;

	fixMenuLinks(role);

	let sections = [];
	if (document.body.dataset.resource) {
		sections = [await buildAdminResourcePage()];
	} else if (role === "admin") {
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

	if (sections.length) {
		main.insertAdjacentHTML("beforeend", `<div class="role-sections">${sections.join("")}</div>`);
	}

	const resource = document.body.dataset.resource;
	if (resource) {
		setupAdminResourceActions(resource);
		setupAdminResourceForm(resource);
		setupResourceSearch(resource);
		await loadAdminResourceRows(resource);
	}
}

function setupResourceSearch(resource) {
	const searchInput = document.querySelector(`[data-resource-search-input="${resource}"]`);
	if (!searchInput) return;
	searchInput.addEventListener("input", () => {
		const query = searchInput.value.trim().toLowerCase();
		const tableBody = document.querySelector(`[data-admin-resource-body="${resource}"]`);
		if (!tableBody) return;
		const rows = Array.from(tableBody.querySelectorAll("tr"));
		rows.forEach((row) => {
			const text = row.textContent.toLowerCase();
			row.style.display = text.includes(query) ? "" : "none";
		});
	});
}

setupRoleDashboard();
