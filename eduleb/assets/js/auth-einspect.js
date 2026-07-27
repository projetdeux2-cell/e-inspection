const loginForm = document.querySelector("[data-login-form]");
const loginMessage = document.querySelector("[data-login-message]");
const logoutMessage = document.querySelector("[data-logout]");

function showLoginMessage(message, type = "info") {
	if (!loginMessage) return;
	loginMessage.textContent = message;
	loginMessage.dataset.type = type;
}

function dashboardForUser(user) {
	const roles = (user?.roles || []).map((role) => role.name);
	if (roles.includes("admin")) return "/e-inspection/eduleb/dashboards/admin.html";
	if (roles.includes("directeur_departemental")) return "/e-inspection/eduleb/dashboards/direction.html";
	if (roles.includes("inspecteur")) return "/e-inspection/eduleb/dashboards/inspecteur.html";
	if (roles.includes("directeur_ecole")) return "/e-inspection/eduleb/dashboards/ecole.html";
	if (roles.includes("enseignant")) return "/e-inspection/eduleb/dashboards/enseignant.html";
	return "/e-inspection/eduleb/dashboards/inspecteur.html";
}

if (loginForm) {
	const emailInput = loginForm.querySelector("[name='email']");
	const passwordInput = loginForm.querySelector("[name='password']");

	if (!emailInput.value) emailInput.value = "admin@e-inspection.local";
	if (!passwordInput.value) passwordInput.value = "password";

	loginForm.addEventListener("submit", async (event) => {
		event.preventDefault();
		showLoginMessage("Connexion en cours...");

		try {
			const payload = await window.EducInspectApi.login(emailInput.value, passwordInput.value);
			window.EducInspectApi.setSession(payload);
			showLoginMessage("Connexion reussie. Ouverture du tableau de bord...", "success");
			let user = payload.user || null;
			if (!user) {
				try {
					user = await window.EducInspectApi.me();
				} catch (e) {
					console.warn("Impossible de récupérer l'utilisateur après login:", e.message || e);
				}
			}
			const target = dashboardForUser(user);
			console.log("login payload:", payload, "resolved user:", user, "redirect:", target);
			window.location.href = target;
		} catch (error) {
			showLoginMessage(error.message || "Connexion impossible. Verifiez le backend Laravel.", "error");
		}
	});
}

if (logoutMessage) {
	(async () => {
		try {
			if (window.EducInspectApi.token) {
				await window.EducInspectApi.logout();
			}
			window.EducInspectApi.clearSession();
			logoutMessage.textContent = "Session fermee. Vous pouvez revenir a la page de connexion.";
		} catch (error) {
			window.EducInspectApi.clearSession();
			logoutMessage.textContent = "Session locale fermee. Le backend n'a pas repondu a la deconnexion.";
		}
	})();
}
