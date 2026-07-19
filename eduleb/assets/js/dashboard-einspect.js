const demoMissions = [
	{ school: "Ecole Primaire Houeyiho 1", city: "Abomey", date: "15/05/2026", inspector: "Koffi A. Mensah", status: "Planifiee" },
	{ school: "Ecole Primaire Djarra", city: "Cove", date: "16/05/2026", inspector: "Aline Tossa", status: "Planifiee" },
	{ school: "Ecole Primaire Ketonou", city: "Porto-Novo", date: "20/05/2026", inspector: "Koffi A. Mensah", status: "Confirmee" },
	{ school: "Ecole Primaire Wologuede", city: "Cotonou", date: "22/05/2026", inspector: "Nadine Soglo", status: "Realisee" }
];

const demoReports = [
	{ ref: "RIP-2026-001", school: "Ecole Primaire Wologuede", score: 82, date: "12/05/2026", status: "Signe" },
	{ ref: "RIP-2026-002", school: "Ecole Primaire Tokpa", score: 65, date: "10/05/2026", status: "En validation" },
	{ ref: "RIP-2026-003", school: "Ecole Primaire Zogbo", score: 78, date: "08/05/2026", status: "Signe" }
];

const demoRecommendations = [
	"Organiser une formation pedagogique pour les enseignants.",
	"Doter l'ecole de manuels scolaires supplementaires.",
	"Mettre en place un suivi regulier des fiches eleves."
];

const fallbackStatusChart = {
	planifiee: 2,
	confirmee: 1,
	realisee: 1
};

const fallbackRecommendationChart = {
	todo: 3,
	done: 2
};

const fallbackInspectionChart = {
	missions: 4,
	inspections: 3
};

const dashboardState = {
	missions: [...demoMissions],
	reports: [...demoReports],
	recommendations: [...demoRecommendations]
};

function normalizeList(payload) {
	if (Array.isArray(payload)) return payload;
	if (Array.isArray(payload?.data)) return payload.data;
	return [];
}

function safeText(value, fallback = "-") {
	return value === undefined || value === null || value === "" ? fallback : value;
}

function parseDate(value) {
	if (!value) return "-";
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("fr-FR");
}

function mapMission(item) {
	return {
		school: item.school?.name || item.school_name || "Ecole non renseignee",
		city: item.school?.commune?.name || item.city || "Commune",
		date: parseDate(item.planned_date || item.date || item.effective_date),
		inspector: item.inspector?.user?.name || item.inspector_name || "Inspecteur",
		status: safeText(item.status, "Planifiee")
	};
}

function mapInspection(item) {
	return {
		ref: item.reference || item.ref || `RIP-${item.id || "inconnu"}`,
		school: item.school?.name || item.school_name || item.mission?.school?.name || "Ecole",
		score: item.global_score || item.score || 0,
		date: parseDate(item.inspection_date || item.date),
		status: safeText(item.status, "Signe")
	};
}

function mapRecommendation(item) {
	if (typeof item === "string") return item;
	return item.description || item.title || "Recommandation";
}

async function loadRemoteDashboardData() {
	if (!window.EducInspectApi?.token) return;

	try {
		const [missionsPayload, inspectionsPayload, recommendationsPayload] = await Promise.all([
			window.EducInspectApi.list("missions"),
			window.EducInspectApi.list("inspections"),
			window.EducInspectApi.list("recommendations")
		]);

		dashboardState.missions = normalizeList(missionsPayload).map(mapMission);
		dashboardState.reports = normalizeList(inspectionsPayload).map(mapInspection);
		dashboardState.recommendations = normalizeList(recommendationsPayload).map(mapRecommendation);
	} catch (error) {
		console.warn("Chargement des donnees API du dashboard impossible, maintien des donnees de demonstration.", error);
	}
}

function renderMissions(list = dashboardState.missions) {
	const body = document.querySelector("[data-missions-body]");
	if (!body) return;
	body.innerHTML = list.map((mission) => `
		<tr>
			<td><strong>${mission.school}</strong><span>${mission.city}</span></td>
			<td>${mission.date}</td>
			<td>${mission.inspector}</td>
			<td><mark class="${badgeClass(mission.status)}">${mission.status}</mark></td>
			<td><button class="mini-btn" type="button">Voir</button></td>
		</tr>
	`).join("");
	document.querySelectorAll("[data-count='missions']").forEach((item) => item.textContent = list.length);
}

function renderReports(list = dashboardState.reports) {
	const body = document.querySelector("[data-reports-body]");
	if (!body) return;
	body.innerHTML = list.map((report) => `
		<tr>
			<td><strong>${report.ref}</strong><span>${report.school}</span></td>
			<td>${report.date}</td>
			<td>${report.score}%</td>
			<td><mark class="${badgeClass(report.status)}">${report.status}</mark></td>
			<td><button class="mini-btn" type="button" data-preview="${report.ref}">Apercu</button></td>
		</tr>
	`).join("");
	document.querySelectorAll("[data-count='reports']").forEach((item) => item.textContent = list.length);
}

// function renderRecommendations() {
// 	const list = document.querySelector("[data-recommendations]");
// 	if (!list) return;
// 	list.innerHTML = dashboardState.recommendations.map((item) => `<li><span class="ti-check"></span>${item}</li>`).join("");
// }

function setupSearch() {
	const input = document.querySelector("[data-dashboard-search]");
	if (!input) return;

	const normalized = (value) => String(value || "").toLowerCase().trim();
	const applyQuery = (query) => {
		const rows = document.querySelectorAll(".data-table tbody tr");
		rows.forEach((row) => {
			const visible = !query || normalized(row.textContent).includes(query);
			row.style.display = visible ? "" : "none";
		});

		document.querySelectorAll(".role-section, .stats-grid .stat-card").forEach((element) => {
			const visible = !query || normalized(element.textContent).includes(query);
			element.style.display = visible ? "" : "none";
		});

		if (document.querySelector("[data-missions-body]")) {
			renderMissions(dashboardState.missions.filter((mission) => normalized(`${mission.school} ${mission.city} ${mission.status}`).includes(query)));
		}
		if (document.querySelector("[data-reports-body]")) {
			renderReports(dashboardState.reports.filter((report) => normalized(`${report.ref} ${report.school} ${report.status}`).includes(query)));
		}
	};

	input.addEventListener("input", () => {
		const query = normalized(input.value);
		applyQuery(query);
	});
}

function setupMissionForm() {
	const form = document.querySelector("[data-mission-form]");
	if (!form) return;
	form.addEventListener("submit", (event) => {
		event.preventDefault();
		const formData = new FormData(form);
		dashboardState.missions.unshift({
			school: formData.get("school") || "Nouvelle ecole",
			city: formData.get("city") || "Commune",
			date: formData.get("date") || "A definir",
			inspector: formData.get("inspector") || "Inspecteur",
			status: "Planifiee"
		});
		form.reset();
		renderMissions();
	});
}

function setupInspectionScore() {
	const form = document.querySelector("[data-inspection-form]");
	if (!form) return;
	const outputs = document.querySelectorAll("[data-score-output]");
	const appreciation = document.querySelector("[data-score-appreciation]");
	const update = () => {
		const inputs = Array.from(form.querySelectorAll("input[type='range']"));
		const total = inputs.reduce((sum, input) => sum + Number(input.value), 0);
		const score = Math.round(total / inputs.length);
		outputs.forEach((output) => output.textContent = `${score}%`);
		appreciation.textContent = score >= 80 ? "Excellent" : score >= 60 ? "Bien" : score >= 40 ? "Moyen" : "Insuffisant";
	};
	form.querySelectorAll("input[type='range']").forEach((input) => input.addEventListener("input", update));
	update();
}

function setupReportPreview() {
	const preview = document.querySelector("[data-report-preview]");
	if (!preview) return;
	document.addEventListener("click", (event) => {
		const button = event.target.closest("[data-preview]");
		if (!button) return;
		const report = dashboardState.reports.find((item) => item.ref === button.dataset.preview);
		if (!report) return;
		preview.innerHTML = `
			<h3>Rapport d'inspection pedagogique</h3>
			<p><strong>Reference :</strong> ${report.ref}</p>
			<p><strong>Ecole :</strong> ${report.school}</p>
			<p><strong>Date :</strong> ${report.date}</p>
			<p><strong>Score global :</strong> ${report.score}%</p>
			<p><strong>Statut :</strong> ${report.status}</p>
		`;
	});
}

function roleChartSource(requiredRole, counts = {}) {
	if (requiredRole === "admin") {
		return {
			todo: Number(counts.recommendations_todo || 0),
			done: Number(counts.recommendations_done || 0)
		};
	}

	if (requiredRole === "directeur_departemental") {
		return {
			missions: Number(counts.missions || 0),
			inspections: Number(counts.inspections || 0)
		};
	}

	if (requiredRole === "inspecteur") {
		return {
			missions: Number(counts.missions || 0),
			inspections: Number(counts.inspections || 0)
		};
	}

	if (requiredRole === "directeur_ecole") {
		return {
			todo: Number(counts.recommendations_todo || 0),
			done: Number(counts.recommendations_done || 0)
		};
	}

	if (requiredRole === "enseignant") {
		return {
			pending: 3,
			done: 2
		};
	}

	return fallbackStatusChart;
}

function statusLabel(status) {
	const value = String(status || "").toLowerCase();
	if (value.includes("plan") || value.includes("planned")) return "Planifiee";
	if (value.includes("confir") || value.includes("confirmed")) return "Confirmee";
	if (value.includes("real") || value.includes("done") || value.includes("completed")) return "Realisee";
	if (value.includes("todo")) return "A suivre";
	if (value.includes("valid")) return "Validation";
	return status || "Statut";
}

function chartKeyLabel(key) {
	const value = String(key || "").toLowerCase();
	if (value.includes("todo") || value.includes("a_suivre") || value.includes("pending")) return "A suivre";
	if (value.includes("done") || value.includes("termine") || value.includes("realise") || value.includes("completed")) return "Traitees";
	if (value.includes("mission")) return "Missions";
	if (value.includes("inspection")) return "Inspections";
	if (value.includes("plan") || value.includes("action")) return "Actions";
	return statusLabel(key);
}

function createChartEntries(statusMap = {}) {
	const entries = Object.entries(statusMap).map(([key, total]) => ({
		key,
		total: Number(total || 0),
		label: chartKeyLabel(key)
	}));

	const ordered = entries.sort((a, b) => b.total - a.total);
	const maxValue = Math.max(...ordered.map((item) => item.total), 1);

	return ordered.map((item) => ({
		...item,
		height: Math.max((item.total / maxValue) * 100, item.total > 0 ? 16 : 0)
	}));
}

function renderDashboardChart(statusMap = fallbackStatusChart) {
	const containers = document.querySelectorAll("[data-dashboard-chart]");
	if (!containers.length) return;

	const entries = createChartEntries(statusMap);
	containers.forEach((container) => {
		container.innerHTML = `
			<div class="chart-bars">
				${entries.map((item) => `
					<div class="chart-bar-item">
						<div class="chart-bar-track">
							<span class="chart-bar-fill" style="height: ${item.height}%;"></span>
						</div>
						<div class="chart-bar-meta">
							<strong>${item.total}</strong>
							<small>${item.label}</small>
						</div>
					</div>
				`.trim()).join("")}
			</div>
		`;
	});
}

function setupLogout() {
	const logout = document.querySelector("[data-logout]");
	if (!logout) return;

	logout.addEventListener("click", async () => {
		try {
			await window.EducInspectApi.logout();
		} catch (error) {
			console.warn("Erreur de déconnexion API", error);
		}

		window.EducInspectApi.clearSession();
		window.location.href = "../index.html";
	});
}

function setupAdminProfileForm() {
	const form = document.querySelector("[data-profile-form]");
	if (!form) return;

	const message = document.querySelector("[data-profile-message]");
	const storedUser = JSON.parse(localStorage.getItem("educinspect_user") || "{}");
	const setText = (text, type = "info") => {
		if (!message) return;
		message.textContent = text;
		message.dataset.type = type;
	};

	if (storedUser.name) form.elements.name.value = storedUser.name;
	if (storedUser.email) form.elements.email.value = storedUser.email;

	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		const payload = {
			name: form.elements.name.value,
			email: form.elements.email.value
		};

		if (form.elements.password.value) {
			payload.password = form.elements.password.value;
		}

		try {
			setText("Enregistrement du profil en cours...");
			if (storedUser.id) {
				await window.EducInspectApi.updateAdminUser(storedUser.id, payload);
			}
			localStorage.setItem("educinspect_user", JSON.stringify({ ...storedUser, ...payload }));
			const userName = document.querySelector("[data-user-name]");
			if (userName) userName.textContent = payload.name || storedUser.name || "Utilisateur";
			setText("Profil mis a jour avec succes.", "success");
			form.reset();
			if (storedUser.name) form.elements.name.value = payload.name;
			if (storedUser.email) form.elements.email.value = payload.email;
			form.elements.password.value = "";
		} catch (error) {
			setText(error.message || "Erreur pendant la mise a jour du profil.", "error");
		}
	});
}

function updateNotificationBadge(count) {
	const bell = document.querySelector(".top-actions .icon-btn em");
	if (!bell) return;
	bell.textContent = Number(count || 0);
}

function updateLiveStatus(text) {
	const status = document.querySelector("[data-live-status]");
	if (!status) return;
	status.textContent = text;
}

async function loadApiDashboard() {
	const statNodes = document.querySelectorAll("[data-api-stat]");
	if (!window.EducInspectApi?.token) {
		renderDashboardChart(roleChartSource(document.body.dataset.requiredRole, {}));
		return;
	}

	try {
		const [dashboardData, usersData, departmentsData, communesData] = await Promise.all([
			window.EducInspectApi.dashboard(),
			window.EducInspectApi.adminUsers(),
			window.EducInspectApi.list("departments"),
			window.EducInspectApi.list("communes")
		]);

		const counts = {
			users: normalizeList(usersData).length,
			departments: normalizeList(departmentsData).length,
			communes: normalizeList(communesData).length,
			...dashboardData
		};

		statNodes.forEach((node) => {
			const key = node.dataset.apiStat;
			if (counts[key] === undefined || counts[key] === null) return;
			node.textContent = key === "average_score" ? `${counts[key]}%` : counts[key];
		});

		renderDashboardChart(roleChartSource(document.body.dataset.requiredRole, counts));

		const notifications = Number(counts.recommendations_todo || 0) + Number(counts.missions || 0);
		updateNotificationBadge(notifications);
		updateLiveStatus(`//
Configuration live · ${counts.users || 0} comptes`);
	} catch (error) {
		console.warn("Dashboard API indisponible, conservation des donnees de demonstration.", error);
		renderDashboardChart(roleChartSource(document.body.dataset.requiredRole, {}));
		updateLiveStatus("Configuration locale");
	}
}

async function initializeDashboard() {
	await loadRemoteDashboardData();
	renderMissions();
	renderReports();
	renderRecommendations();
	setupSearch();
	setupMissionForm();
	setupInspectionScore();
	setupReportPreview();
	setupLogout();
	setupAdminProfileForm();
	await loadApiDashboard();
}

initializeDashboard();

function badgeClass(status) {
	const value = String(status).toLowerCase();
	if (value.includes("realisee") || value.includes("signe")) return "badge success";
	if (value.includes("confirmee") || value.includes("validation")) return "badge info";
	return "badge warning";
}
