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
	if (roles.includes("admin")) return "dashboards/admin.html";
	if (roles.includes("directeur_departemental")) return "dashboards/direction.html";
	if (roles.includes("inspecteur")) return "dashboards/inspecteur.html";
	if (roles.includes("directeur_ecole")) return "dashboards/ecole.html";
	if (roles.includes("enseignant")) return "dashboards/enseignant.html";
	return "dashboards/inspecteur.html";
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
			window.location.href = dashboardForUser(payload.user);
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
			logoutMessage.textContent = "Votre session a été fermée avec succès. Vous pouvez vous reconnecter dès maintenant.";
		} catch (error) {
			window.EducInspectApi.clearSession();
			logoutMessage.textContent = "Votre session locale a été fermée. Le backend n’a pas répondu à la déconnexion.";
		}
	})();
}
