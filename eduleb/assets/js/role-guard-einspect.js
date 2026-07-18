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

function redirectToRoleDashboard(roles) {
	const role = Object.keys(roleDashboardMap).find((item) => roles.includes(item));
	window.location.href = role ? roleDashboardMap[role] : "../login.html";
}

function protectDashboard() {
	const requiredRole = document.body.dataset.requiredRole;
	if (!requiredRole) return;

	const user = readSessionUser();
	const roles = getUserRoles(user);
	const token = localStorage.getItem("educinspect_token");

	if (!token || !user) {
		window.location.href = "../login.html";
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
