const roleDashboardMap = {
	admin: "admin.html",
	directeur_departemental: "direction.html",
	inspecteur: "inspecteur.html",
	directeur_ecole: "ecole.html",
	enseignant: "enseignant.html"
};

const roleLabels = {
	admin: "Administrateur",
	directeur_departemental: "Direction departementale",
	inspecteur: "Inspecteur pedagogique",
	directeur_ecole: "Direction d'ecole",
	enseignant: "Enseignant"
};

function readSessionUser() {
	try {
		return JSON.parse(localStorage.getItem("educinspect_user") || "null");
	} catch (error) {
		return null;
	}
}

function getUserRoles(user) {
	return (user?.roles || []).map((role) => role.name);
}

function getDashboardHeaderLabel() {
	const activeLink = document.querySelector(".side-nav a.active");
	const activeText = activeLink?.textContent?.replace(/\s+/g, " ").trim();
	if (activeText) return activeText;

	const heading = document.querySelector(".dashboard-head h1, .main h1, h1");
	const headingText = heading?.textContent?.replace(/\s+/g, " ").trim();
	if (headingText) return headingText;

	const title = document.title.replace(/\s*-\s*EducInspect.*$/i, "").trim();
	return title || "Dashboard";
}

function simplifyDashboardHeader() {
	const topbar = document.querySelector(".topbar");
	if (!topbar || topbar.dataset.minimalized === "true") return;
	if (!document.body?.dataset?.requiredRole) return;

	const title = getDashboardHeaderLabel();
	topbar.classList.add("topbar--minimal");
	topbar.dataset.minimalized = "true";
	topbar.innerHTML = `<h1 class="topbar-title">${title}</h1>`;
}

function redirectToRoleDashboard(roles) {
	const role = Object.keys(roleDashboardMap).find((item) => roles.includes(item));
	window.location.href = role ? roleDashboardMap[role] : "../login.html";
}

function protectDashboard() {
	const requiredRole = document.body.dataset.requiredRole;
	const allowedRoles = (document.body.dataset.allowedRoles || requiredRole || "")
		.split(",")
		.map((role) => role.trim())
		.filter(Boolean);
	if (!allowedRoles.length) return;

	const user = readSessionUser();
	const roles = getUserRoles(user);
	const token = localStorage.getItem("educinspect_token");

	if (!token || !user) {
		console.warn('Aucune session trouvée dans localStorage (educinspect_token / educinspect_user)');
		// Afficher une bannière de debug informant l'utilisateur et proposant
		// d'activer une session de dev locale pour tester l'UI sans backend.
		try {
			const banner = document.createElement('div');
			banner.id = 'educinspect-debug-banner';
			banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#fff3cd;color:#856404;padding:12px;z-index:99999;border-bottom:1px solid #ffe8a1;text-align:center;font-weight:600;';
			banner.innerHTML = `Session non trouvée. <button id="devSetSession" style="margin-left:12px;padding:6px 10px;border-radius:6px;border:1px solid #ffd966;background:#fff;cursor:pointer;">Activer session dev</button> <a href="../login.html" style="margin-left:12px;color:#0a66ff;text-decoration:underline;">Aller au login</a>`;
			if (document.body) document.body.prepend(banner);
			const btn = document.getElementById('devSetSession');
			if (btn) {
				btn.addEventListener('click', () => {
					localStorage.setItem('educinspect_token', 'devtoken');
					const roleName = allowedRoles[0] || 'admin';
					localStorage.setItem('educinspect_user', JSON.stringify({ name: 'Dev Utilisateur', roles: [{ name: roleName }] }));
					location.reload();
				});
			}
		} catch (e) {
			// fallback to redirect if DOM not ready
			window.location.href = "../login.html";
		}
		return;
	}

	if (!allowedRoles.some((role) => roles.includes(role))) {
		redirectToRoleDashboard(roles);
		return;
	}

	simplifyDashboardHeader();

	document.querySelectorAll("[data-user-name]").forEach((item) => {
		item.textContent = user.name || "Utilisateur";
	});

	document.querySelectorAll("[data-user-role]").forEach((item) => {
		item.textContent = roleLabels[requiredRole] || requiredRole;
	});
}

protectDashboard();

window.addEventListener("pageshow", (event) => {
	if (event.persisted) protectDashboard();
});
