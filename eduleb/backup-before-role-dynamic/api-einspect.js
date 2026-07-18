const EducInspectApi = {
	baseUrl: "http://127.0.0.1/e-inspection-api/public/api",

	get token() {
		return localStorage.getItem("educinspect_token");
	},

	setSession(payload) {
		localStorage.setItem("educinspect_token", payload.token);
		localStorage.setItem("educinspect_user", JSON.stringify(payload.user));
		localStorage.setItem("educinspect_permissions", JSON.stringify(payload.permissions || []));
	},

	clearSession() {
		localStorage.removeItem("educinspect_token");
		localStorage.removeItem("educinspect_user");
		localStorage.removeItem("educinspect_permissions");
	},

	async request(path, options = {}) {
		const headers = {
			Accept: "application/json",
			...(options.body ? { "Content-Type": "application/json" } : {}),
			...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
			...(options.headers || {})
		};

		const response = await fetch(`${this.baseUrl}${path}`, {
			...options,
			headers
		});

		const text = await response.text();
		const data = text ? JSON.parse(text) : {};

		if (!response.ok) {
			const message = data.message || Object.values(data.errors || {})[0]?.[0] || "Une erreur est survenue.";
			throw new Error(message);
		}

		return data;
	},

	login(email, password) {
		return this.request("/login", {
			method: "POST",
			body: JSON.stringify({ email, password })
		});
	},

	me() {
		return this.request("/me");
	},

	dashboard() {
		return this.request("/dashboard");
	},

	missions() {
		return this.request("/missions");
	},

	logout() {
		return this.request("/logout", { method: "POST" });
	}
};

window.EducInspectApi = EducInspectApi;
