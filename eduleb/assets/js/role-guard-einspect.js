const roleDashboardMap = {
	admin: "/e-inspection/eduleb/dashboards/admin.html",
	directeur_departemental: "/e-inspection/eduleb/dashboards/direction.html",
	inspecteur: "/e-inspection/eduleb/dashboards/inspecteur.html",
	directeur_ecole: "/e-inspection/eduleb/dashboards/ecole.html",
	enseignant: "/e-inspection/eduleb/dashboards/enseignant.html"
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

function redirectToRoleDashboard(roles) {
	const role = Object.keys(roleDashboardMap).find((item) => roles.includes(item));
	window.location.href = role ? roleDashboardMap[role] : "/e-inspection/eduleb/login.html";
}

function protectDashboard() {
	const requiredRole = document.body.dataset.requiredRole;
	if (!requiredRole) return;

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
					const roleName = requiredRole || 'admin';
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

	if (!roles.includes(requiredRole)) {
		redirectToRoleDashboard(roles);
		return;
	}

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
