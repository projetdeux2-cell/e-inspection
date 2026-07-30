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

window.InspectorReportPage = window.InspectorReportPage || {
	allReports: [],
	updateSummary: null,
	addReport(report) {
		if (!Array.isArray(this.allReports)) {
			this.allReports = [];
		}
		this.allReports.unshift(report);
		if (typeof this.updateSummary === "function") {
			this.updateSummary(this.allReports);
		}
	}
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

function renderInspectorReports(list = []) {
	const body = document.querySelector("[data-reports-body]");
	const count = document.querySelector("[data-reports-count]");
	if (!body) return;
	if (!list.length) {
		body.innerHTML = '<tr><td colspan="6"><div class="empty-state"><span class="ti-files"></span><h4>Aucun rapport</h4><p>Aucun rapport ne correspond.</p></div></td></tr>';
		if (count) count.textContent = "0 rapport(s)";
		return;
	}
	body.innerHTML = list.map((report) => {
		const score = report.global_score || report.score || 0;
		return `
			<tr>
				<td><strong>${report.reference || report.ref || `RIP-${report.id || "?"}`}</strong><span class="sub">${report.school || report.mission?.school?.name || ""}</span></td>
				<td>${report.date || report.inspection_date || "-"}</td>
				<td class="score-cell" style="color:${scoreColor(score)}">${score}%</td>
				<td><span class="badge ${badgeClass(report.status)}">${report.status || "-"}</span></td>
				<td><button class="mini-btn" type="button" data-preview="${report.reference || report.ref}">Apercu</button></td>
			</tr>
		`;
	}).join("");
	if (count) count.textContent = `${list.length} rapport(s)`;
}

function renderInspectorSummary(reports = []) {
	const totalEl = document.querySelector("[data-total]");
	const signedEl = document.querySelector("[data-signed]");
	const avgEl = document.querySelector("[data-avg-score]");
	if (totalEl) totalEl.textContent = reports.length;
	if (signedEl) signedEl.textContent = reports.filter((r) => String(r.status || "").toLowerCase().includes("signe")).length;
	const scores = reports.map((r) => Number(r.global_score || r.score || 0)).filter((s) => s > 0);
	const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
	if (avgEl) avgEl.textContent = avg + "%";
	window.InspectorReportPage.updateSummary = renderInspectorSummary;
}

function setupInspectorReportsPage() {
	const body = document.querySelector("[data-reports-body]");
	const search = document.querySelector("[data-search-reports]");
	const filtersContainer = document.querySelector(".filter-group");
	if (!body) return;
	const reportFilters = filtersContainer ? filtersContainer.querySelectorAll("[data-filter]") : [];
	window.InspectorReportPage.allReports = [];
	window.InspectorReportPage.currentFilter = "all";

	const renderFilteredReports = () => {
		const query = (search?.value || "").toLowerCase().trim();
		let filtered = [...window.InspectorReportPage.allReports];
		if (window.InspectorReportPage.currentFilter !== "all") {
			filtered = filtered.filter((report) => String(report.status || "").toLowerCase().includes(window.InspectorReportPage.currentFilter));
		}
		if (query) {
			filtered = filtered.filter((report) => {
				const text = [report.reference, report.ref, report.school, report.status, report.mission?.school?.name].join(" ").toLowerCase();
				return text.includes(query);
			});
		}
		renderInspectorReports(filtered);
	};

	reportFilters.forEach((button) => {
		button.addEventListener("click", () => {
			reportFilters.forEach((b) => b.classList.remove("active"));
			button.classList.add("active");
			window.InspectorReportPage.currentFilter = button.dataset.filter || "all";
			renderFilteredReports();
		});
	});

	search?.addEventListener("input", renderFilteredReports);

	function loadReports() {
		if (!window.EducInspectApi?.list) return Promise.resolve([]);
		return window.EducInspectApi.list("inspections").then((data) => {
			return Array.isArray(data) ? data : (data?.data || []);
		}).catch(() => []);
	}

	loadReports().then((reports) => {
		window.InspectorReportPage.allReports = reports;
		renderInspectorSummary(reports);
		renderFilteredReports();
	});
}

function renderRecommendations() {
	const list = document.querySelector("[data-recommendations]");
	if (!list) return;
	list.innerHTML = dashboardState.recommendations.map((item) => `<li><span class="ti-check"></span>${item}</li>`).join("");
}

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

function buildReportPayload(form) {
	const data = new FormData(form);
	const preparation = Number(data.get("preparation") || 0);
	const pedagogie = Number(data.get("pedagogie") || 0);
	const gestion = Number(data.get("gestion") || 0);
	const documents = Number(data.get("documents") || 0);
	const score = Math.round((preparation + pedagogie + gestion + documents) / 4);
	return {
		reference: data.get("reference") || `RIP-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
		school: data.get("school") || "Ecole",
		teacher: data.get("teacher") || "",
		date: data.get("date") || new Date().toISOString().slice(0, 10),
		status: data.get("status") || "En validation",
		preparation,
		pedagogie,
		gestion,
		documents,
		observations: data.get("observations") || "",
		recommendations: data.get("recommendations") || "",
		notes: data.get("notes") || "",
		global_score: score,
		id: Date.now()
	};
}

const INBOX_KEY = "educinspect_inbox";

function getInboxReports() {
	try { return JSON.parse(localStorage.getItem(INBOX_KEY) || "[]"); }
	catch { return []; }
}

function saveReportToInbox(report) {
	const reports = getInboxReports();
	reports.unshift(report);
	localStorage.setItem(INBOX_KEY, JSON.stringify(reports));
}

function renderReportDocument(report) {
	return `
		<div class="report-doc">
			<h3>Rapport d'inspection pedagogique</h3>
			<div class="report-row"><div><strong>Reference</strong><span>${report.reference}</span></div><div><strong>Ecole</strong><span>${report.school}</span></div></div>
			<div class="report-row"><div><strong>Date</strong><span>${report.date}</span></div><div><strong>Statut</strong><span>${report.status}</span></div></div>
			<div class="report-row"><div><strong>Score global</strong><span>${report.global_score}%</span></div><div><strong>Evaluation</strong><span>${report.global_score >= 80 ? "Excellent" : report.global_score >= 60 ? "Bien" : report.global_score >= 40 ? "Moyen" : "Insuffisant"}</span></div></div>
			<div><strong>Details</strong></div>
			<ul>
				<li>Preparation des cours : ${report.preparation}%</li>
				<li>Pedagogie et methodes : ${report.pedagogie}%</li>
				<li>Gestion de classe : ${report.gestion}%</li>
				<li>Documents scolaires : ${report.documents}%</li>
			</ul>
			<div><strong>Observations</strong><p>${report.observations || "Aucune observation saisie."}</p></div>
			<div><strong>Recommandations</strong><p>${report.recommendations || "Aucune recommandation."}</p></div>
			<div><strong>Notes</strong><p>${report.notes || "Aucune note."}</p></div>
		</div>
	`;
}

function updateReportPreview(report) {
	const preview = document.querySelector("[data-report-preview]");
	if (!preview) return;
	preview.innerHTML = renderReportDocument(report);
}

function appendReportRow(report) {
	const body = document.querySelector("[data-reports-body]");
	if (!body) return;
	const rowHtml = `
		<tr>
			<td><strong>${report.reference}</strong><span class="sub">${report.school}</span></td>
			<td>${report.date}</td>
			<td class="score-cell" style="color:${scoreColor(report.global_score)}">${report.global_score}%</td>
			<td><span class="badge ${badgeClass(report.status)}">${report.status}</span></td>
			<td><button class="mini-btn" type="button" data-preview="${report.reference}">Apercu</button></td>
		</tr>
	`;
	if (body.children.length === 1 && body.children[0].querySelector(".empty-state")) {
		body.innerHTML = rowHtml;
	} else {
		body.insertAdjacentHTML("beforeend", rowHtml);
	}
	const count = document.querySelector("[data-reports-count]");
	if (count) {
		const current = Number((count.textContent.match(/\d+/) || [0])[0]);
		count.textContent = `${current + 1} rapport(s)`;
	}
	window.InspectorReportPage.addReport(report);
}

function updateReportBuilderPreviewLabels(form) {
	form.querySelectorAll("[data-report-score]").forEach((input) => {
		const label = form.querySelector(`[data-criteria-label="${input.name}"]`);
		if (label) label.textContent = `${input.value}%`;
	});
}

function exportReportAsPdf(report) {
	const evalClass = report.global_score >= 80 ? "excellent" : report.global_score >= 60 ? "bien" : report.global_score >= 40 ? "moyen" : "insuffisant";
	const evalLabel = report.global_score >= 80 ? "Excellent" : report.global_score >= 60 ? "Bien" : report.global_score >= 40 ? "Moyen" : "Insuffisant";
	const printable = `
		<!DOCTYPE html>
		<html lang="fr">
		<head>
			<meta charset="UTF-8">
			<title>Rapport ${report.reference}</title>
			<style>
				@page { margin: 20mm 15mm; }
				body { font-family: 'Segoe UI', Arial, sans-serif; padding: 0; margin: 0; color: #0a1e3c; }
				.header { background: linear-gradient(135deg, #0a1e3c 0%, #1a3a5c 100%); color: #fff; padding: 32px 40px; }
				.header h1 { margin: 0 0 4px; font-size: 26px; font-weight: 800; }
				.header p { margin: 0; font-size: 14px; opacity: .8; }
				.content { padding: 32px 40px; }
				.meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; }
				.meta-item { }
				.meta-item strong { display: block; font-size: 11px; text-transform: uppercase; color: #6b7a93; margin-bottom: 2px; }
				.meta-item span { font-size: 15px; font-weight: 700; color: #0a1e3c; }
				.score-banner { display: flex; align-items: center; gap: 24px; padding: 24px; border-radius: 14px; margin-bottom: 28px; }
				.score-banner.excellent { background: #ecfdf5; border: 1px solid #a7f3d0; }
				.score-banner.bien { background: #eff6ff; border: 1px solid #bfdbfe; }
				.score-banner.moyen { background: #fff7ed; border: 1px solid #fed7aa; }
				.score-banner.insuffisant { background: #fef2f2; border: 1px solid #fecaca; }
				.score-banner .score-number { font-size: 48px; font-weight: 900; }
				.score-banner.excellent .score-number { color: #059669; }
				.score-banner.bien .score-number { color: #2563eb; }
				.score-banner.moyen .score-number { color: #ea580c; }
				.score-banner.insuffisant .score-number { color: #dc2626; }
				.score-banner .score-label { }
				.score-banner .score-label strong { font-size: 18px; display: block; }
				.score-banner .score-label small { font-size: 13px; color: #6b7a93; }
				h2 { font-size: 18px; font-weight: 800; margin: 0 0 16px; color: #0a1e3c; }
				.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 28px; }
				.detail-item { display: flex; justify-content: space-between; padding: 12px 16px; background: #f8fafc; border-radius: 10px; }
				.detail-item .label { font-size: 14px; color: #475467; }
				.detail-item .value { font-weight: 800; color: #0a1e3c; }
				.section { margin-bottom: 24px; }
				.section h3 { font-size: 15px; font-weight: 700; margin: 0 0 8px; color: #0a1e3c; }
				.section p, .section li { font-size: 14px; line-height: 1.6; color: #475467; }
				.section ul { padding-left: 20px; margin: 0; }
				.footer { text-align: center; padding: 20px 40px; border-top: 1px solid #eef2f7; font-size: 12px; color: #9aaec5; }
			</style>
		</head>
		<body>
			<div class="header">
				<h1>Rapport d'inspection pedagogique</h1>
				<p>Ministere des Enseignements Maternel et Primaire - EducInspect</p>
			</div>
			<div class="content">
				<div class="meta-grid">
					<div class="meta-item"><strong>Reference</strong><span>${report.reference}</span></div>
					<div class="meta-item"><strong>Date d'inspection</strong><span>${report.date}</span></div>
					<div class="meta-item"><strong>Ecole</strong><span>${report.school}</span></div>
					<div class="meta-item"><strong>Statut</strong><span>${report.status}</span></div>
					${report.teacher ? `<div class="meta-item"><strong>Enseignant</strong><span>${report.teacher}</span></div>` : ""}
				</div>
				<div class="score-banner ${evalClass}">
					<div class="score-number">${report.global_score}%</div>
					<div class="score-label"><strong>${evalLabel}</strong><small>Score global d'inspection</small></div>
				</div>
				<h2>Details de l'evaluation</h2>
				<div class="detail-grid">
					<div class="detail-item"><span class="label">Preparation des cours</span><span class="value">${report.preparation}%</span></div>
					<div class="detail-item"><span class="label">Pedagogie et methodes</span><span class="value">${report.pedagogie}%</span></div>
					<div class="detail-item"><span class="label">Gestion de classe</span><span class="value">${report.gestion}%</span></div>
					<div class="detail-item"><span class="label">Documents scolaires</span><span class="value">${report.documents}%</span></div>
				</div>
				<div class="section">
					<h3>Observations</h3>
					<p>${report.observations || "Aucune observation saisie."}</p>
				</div>
				<div class="section">
					<h3>Recommandations</h3>
					${report.recommendations ? `<ul>${report.recommendations.split("\\n").filter(Boolean).map(r => `<li>${r}</li>`).join("")}</ul>` : "<p>Aucune recommandation.</p>"}
				</div>
				<div class="section">
					<h3>Notes techniques</h3>
					<p>${report.notes || "Aucune note."}</p>
				</div>
			</div>
			<div class="footer">
				<p>Document genere par EducInspect &bull; ${new Date().toLocaleDateString("fr-FR")}</p>
			</div>
			<script>window.onload = function() { window.print(); };</script>
		</body>
		</html>
	`;
	const win = window.open("", "_blank");
	if (!win) return;
	win.document.write(printable);
	win.document.close();
}

function getAvailableInspectionSchools(missions) {
	const schools = [];
	const seen = new Set();
	(missions || []).forEach((mission) => {
		const name = mission.school?.name || mission.school_name || (typeof mission.school === "string" ? mission.school : undefined);
		const commune = mission.school?.commune?.name || mission.school?.commune || mission.city || mission.commune;
		if (!name) return;
		const key = `${name}||${commune || ""}`;
		if (seen.has(key)) return;
		seen.add(key);
		schools.push({ name, commune });
	});
	return schools;
}

function populateSchoolSelect(select, schools) {
	if (!select) return;
	if (!schools.length) {
		select.innerHTML = '<option value="">Aucune ecole disponible</option>';
		return;
	}
	select.innerHTML = '<option value="">Selectionner une ecole</option>' + schools.map((school) => {
		const label = school.commune ? `${school.name} (${school.commune})` : school.name;
		return `<option value="${school.name}">${label}</option>`;
	}).join("");
	select.selectedIndex = 1;
}

async function loadReportSchools(select) {
	if (!select) return Promise.resolve([]);
	const loadFromMissions = (missions) => {
		const schools = getAvailableInspectionSchools(missions);
		populateSchoolSelect(select, schools);
		return schools;
	};

	if (!window.EducInspectApi?.list || !window.EducInspectApi.token) {
		return Promise.resolve(loadFromMissions(dashboardState.missions));
	}

	return window.EducInspectApi.list("missions").then((data) => {
		const missions = normalizeList(data) || data?.missions || [];
		if (!missions.length) {
			console.warn("Aucune mission trouvee via l'API, utilisation du fallback local.");
			return loadFromMissions(dashboardState.missions);
		}
		return loadFromMissions(missions);
	}).catch((error) => {
		console.warn("Erreur lors du chargement des missions pour les ecoles :", error);
		return loadFromMissions(dashboardState.missions);
	});
}

function setupReportBuilder() {
	const form = document.querySelector("[data-report-form]");
	if (!form) return;
	const exportButton = document.querySelector("[data-export-report]");
	const schoolSelect = form.querySelector("select[name='school']");
	const searchInput = document.querySelector("[data-report-search]");
	let availableSchools = [];

	const update = () => {
		updateReportBuilderPreviewLabels(form);
		updateReportPreview(buildReportPayload(form));
	};

	loadReportSchools(schoolSelect).then((schools) => {
		availableSchools = schools;
	});

	const filterSchoolOptions = () => {
		if (!schoolSelect || !availableSchools.length) return;
		const query = (searchInput?.value || "").toLowerCase().trim();
		const filtered = availableSchools.filter((school) => {
			return [school.name, school.commune].filter(Boolean).join(" ").toLowerCase().includes(query);
		});
		populateSchoolSelect(schoolSelect, filtered);
	};

	searchInput?.addEventListener("input", filterSchoolOptions);
	form.querySelectorAll("[data-report-score]").forEach((input) => input.addEventListener("input", update));
	update();

	form.addEventListener("submit", (event) => {
		event.preventDefault();
		const report = buildReportPayload(form);
		dashboardState.reports.unshift(report);
		appendReportRow(report);
		updateReportPreview(report);
		saveReportToInbox(report);
		const submitButton = form.querySelector("button[type='submit']");
		if (submitButton) {
			submitButton.textContent = "Rapport envoye (Direction, Ecole, Enseignant)";
			submitButton.style.background = "#16A34A";
			setTimeout(() => {
				submitButton.textContent = "Enregistrer le rapport";
				submitButton.style.background = "";
			}, 2500);
		}
	});

	exportButton?.addEventListener("click", () => {
		const report = buildReportPayload(form);
		exportReportAsPdf(report);
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

function formatRelativeTime(value) {
	if (!value) return "Aucune date";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	const diffMinutes = Math.max(1, Math.floor((Date.now() - date.getTime()) / 60000));
	if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
	const diffHours = Math.floor(diffMinutes / 60);
	if (diffHours < 24) return `Il y a ${diffHours} h`;
	const diffDays = Math.floor(diffHours / 24);
	return `Il y a ${diffDays} j`;
}

function renderAdminRecentActivity(usersData, schoolsData, departmentsData, communesData) {
	const body = document.querySelector("[data-recent-activity-body]");
	if (!body) return;

	const records = [
		{
			entity: "Comptes utilisateurs",
			description: "Roles et permissions",
			updatedAt: normalizeList(usersData).sort((a, b) => new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0))[0]?.created_at || new Date().toISOString(),
			status: "Synchronise",
			badge: "success"
		},
		{
			entity: "Referentiel ecoles",
			description: "Structures scolaires",
			updatedAt: normalizeList(schoolsData).sort((a, b) => new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0))[0]?.created_at || new Date().toISOString(),
			status: "A jour",
			badge: "info"
		},
		{
			entity: "Departements",
			description: "Cartographie administrative",
			updatedAt: normalizeList(departmentsData).sort((a, b) => new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0))[0]?.created_at || new Date().toISOString(),
			status: "A verifier",
			badge: "warning"
		},
		{
			entity: "Communes",
			description: "Territoires referencés",
			updatedAt: normalizeList(communesData).sort((a, b) => new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0))[0]?.created_at || new Date().toISOString(),
			status: "Synchronise",
			badge: "success"
		}
	];

	body.innerHTML = records.map((row) => `
		<tr>
			<td><strong>${row.entity}</strong><span>${row.description}</span></td>
			<td>${formatRelativeTime(row.updatedAt)}</td>
			<td><mark class="badge ${row.badge}">${row.status}</mark></td>
		</tr>
	`).join("");
}

function renderAdminPerformanceSummary(counts) {
	const performanceNode = document.querySelector("[data-performance-score]");
	const coverageNode = document.querySelector("[data-coverage-rate]");
	const activeUsersNode = document.querySelector("[data-active-users-rate]");
	const reportsValidatedNode = document.querySelector("[data-reports-validated-rate]");

	if (!performanceNode || !coverageNode || !activeUsersNode || !reportsValidatedNode) return;

	const schools = Number(counts.schools || 0);
	const departments = Number(counts.departments || 0);
	const communes = Number(counts.communes || 0);
	const users = Number(counts.users || 0);
	const inspections = Number(counts.inspections || 0);
	const missions = Number(counts.missions || 0);
	const recommendationsDone = Number(counts.recommendations_done || 0);

	const coverageRate = Math.min(99, Math.max(55, Math.round(((schools * 3) + (communes * 2) + departments) / Math.max(1, schools + departments + communes + 1) * 100)));
	const activeUsersRate = Math.min(99, Math.max(70, Math.round((users / Math.max(1, users + Math.max(1, departments + communes))) * 100)));
	const reportsValidatedRate = Math.min(99, Math.max(50, Math.round((inspections / Math.max(1, Math.max(inspections, missions))) * 100)));
	const performanceScore = Math.min(99, Math.max(65, Math.round(((coverageRate * 0.35) + (activeUsersRate * 0.25) + (reportsValidatedRate * 0.25) + (recommendationsDone ? 10 : 5))))) ;

	performanceNode.textContent = `${performanceScore}%`;
	coverageNode.textContent = `${coverageRate}%`;
	activeUsersNode.textContent = `${activeUsersRate}%`;
	reportsValidatedNode.textContent = `${reportsValidatedRate}%`;
}

async function loadApiDashboard() {
	const statNodes = document.querySelectorAll("[data-api-stat]");
	if (!window.EducInspectApi?.token) {
		renderDashboardChart(roleChartSource(document.body.dataset.requiredRole, {}));
		return;
	}

	try {
		const [dashboardData, usersData, departmentsData, communesData, schoolsData] = await Promise.all([
			window.EducInspectApi.dashboard(),
			window.EducInspectApi.adminUsers(),
			window.EducInspectApi.list("departments"),
			window.EducInspectApi.list("communes"),
			window.EducInspectApi.list("schools")
		]);

		const counts = {
			users: normalizeList(usersData).length,
			departments: normalizeList(departmentsData).length,
			communes: normalizeList(communesData).length,
			schools: normalizeList(schoolsData).length,
			...dashboardData
		};

		statNodes.forEach((node) => {
			const key = node.dataset.apiStat;
			if (counts[key] === undefined || counts[key] === null) return;
			node.textContent = key === "average_score" ? `${counts[key]}%` : counts[key];
		});

		renderAdminRecentActivity(usersData, schoolsData, departmentsData, communesData);
		renderAdminPerformanceSummary(counts);
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

async function loadInspectorDashboard() {
	const role = document.body.dataset.requiredRole;
	if (role !== "inspecteur") return;

	const missionsBody = document.querySelector("[data-missions-body]");
	const recsList = document.querySelector("[data-recommendations]");

	const [missionsData, inspectionsData, recsData] = await Promise.all([
		fetchList("missions"),
		fetchList("inspections"),
		fetchList("recommendations")
	]);

	const missions = normalizeList(missionsData).map((item) => ({
		school: item.school?.name || item.school_name || "Ecole",
		commune: item.school?.commune?.name || "-",
		date: safeText(item.planned_date || item.date),
		status: safeText(item.status, "Planifiee"),
		id: item.id
	}));

	const inspections = normalizeList(inspectionsData);
	const recs = normalizeList(recsData);

	if (missionsBody) {
		if (!missions.length) {
			missionsBody.innerHTML = '<tr><td colspan="5">Aucune mission assignee.</td></tr>';
		} else {
			missionsBody.innerHTML = missions.map((m) => `
				<tr>
					<td><strong>${m.school}</strong><span>${m.commune}</span></td>
					<td>${m.date}</td>
					<td>${m.commune}</td>
					<td><mark class="${badgeClass(m.status)}">${m.status}</mark></td>
					<td><button class="mini-btn" type="button" data-mission-detail="${m.id}">Voir</button></td>
				</tr>
			`).join("");
		}
	}

	if (recsList) {
		if (!recs.length) {
			recsList.innerHTML = '<li>Aucune recommandation en cours</li>';
		} else {
			recsList.innerHTML = recs.slice(0, 5).map((item) => {
				const text = typeof item === "string" ? item : (item.description || item.title || "Recommandation");
				return `<li><span></span>${text}</li>`;
			}).join("");
		}
	}

	const avgScore = computeAverageScore(inspections);
	const counts = {
		missions: missions.length,
		inspections: inspections.length,
		schools: new Set(missions.map((m) => m.school)).size || 1,
		average_score: avgScore,
		recommendations_todo: recs.filter((r) => !String(r.status || "").toLowerCase().includes("done") && !String(r.status || "").toLowerCase().includes("termine")).length
	};

	document.querySelectorAll("[data-api-stat]").forEach((node) => {
		const key = node.dataset.apiStat;
		if (counts[key] === undefined || counts[key] === null) return;
		node.textContent = key === "average_score" ? `${counts[key]}%` : counts[key];
	});

	const perfScore = document.querySelector("[data-performance-score]");
	if (perfScore) perfScore.textContent = `${avgScore}%`;

	const missionsDone = document.querySelector("[data-missions-done]");
	if (missionsDone) missionsDone.textContent = counts.inspections;

	const missionsPlanned = document.querySelector("[data-missions-planned]");
	if (missionsPlanned) missionsPlanned.textContent = counts.missions;

	const recsCount = document.querySelector("[data-recs-count]");
	if (recsCount) recsCount.textContent = counts.recommendations_todo;

	const notifCount = document.querySelector("[data-notification-count]");
	if (notifCount) notifCount.textContent = counts.recommendations_todo;

	const liveStatus = document.querySelector("[data-live-status]");
	if (liveStatus) liveStatus.textContent = `${counts.missions} missions, ${counts.inspections} inspections`;

	renderDashboardChart({ missions: counts.missions, inspections: counts.inspections });
}

function computeAverageScore(inspections) {
	if (!inspections.length) return 0;
	const scores = inspections.map((i) => Number(i.global_score || i.score || 0)).filter((s) => s > 0);
	if (!scores.length) return 0;
	return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function setupReportPreview() {
	const preview = document.querySelector("[data-report-preview]");
	if (!preview) return;
	preview.innerHTML = "";
}

async function initializeDashboard() {
	const isInspectorDashboard = document.body.dataset.requiredRole === "inspecteur";
	await loadRemoteDashboardData();
	if (isInspectorDashboard) {
		await loadInspectorDashboard();
	} else {
		renderMissions();
		renderReports();
		renderRecommendations();
	}
	setupSearch();
	setupMissionForm();
	setupInspectionScore();
	setupReportBuilder();
	setupInspectorReportsPage();
	setupReportPreview();
	setupLogout();
	setupAdminProfileForm();
	if (!isInspectorDashboard) await loadApiDashboard();
}

window.addEventListener("DOMContentLoaded", initializeDashboard);

function badgeClass(status) {
	const value = String(status).toLowerCase();
	if (value.includes("realisee") || value.includes("signe")) return "badge success";
	if (value.includes("confirmee") || value.includes("validation")) return "badge info";
	return "badge warning";
}
