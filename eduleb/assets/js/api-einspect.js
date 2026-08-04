const REQUEST_TIMEOUT_MS = 15000;

const EducInspectApi = {
	baseUrl: "http://127.0.0.1:8000/api",

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

		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
		try {
			const response = await fetch(`${this.baseUrl}${path}`, {
				...options,
				headers,
				signal: controller.signal
			});

			const text = await response.text();
			const data = text ? JSON.parse(text) : {};

			if (!response.ok) {
				const message = data.message || Object.values(data.errors || {})[0]?.[0] || "Une erreur est survenue.";
				throw new Error(message);
			}

			return data;
		} finally {
			clearTimeout(timer);
		}
	},

	async downloadPdf(path, payload) {
		const headers = {
			Accept: "application/pdf",
			"Content-Type": "application/json",
			...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
		};

		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
		try {
			const response = await fetch(`${this.baseUrl}${path}`, {
				method: "POST",
				headers,
				body: JSON.stringify(payload),
				signal: controller.signal
			});

			if (!response.ok) {
				let message = "Une erreur est survenue.";
				try {
					const data = await response.json();
					message = data.message || Object.values(data.errors || {})[0]?.[0] || message;
				} catch {}
				throw new Error(message);
			}

			return await response.blob();
		} finally {
			clearTimeout(timer);
		}
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

	list(resource, params = {}) {
		const query = new URLSearchParams(params).toString();
		return this.request(`/${resource}${query ? `?${query}` : ""}`);
	},

	createResource(resource, payload) {
		return this.request(`/${resource}`, {
			method: "POST",
			body: JSON.stringify(payload)
		});
	},

	updateResource(resource, id, payload) {
		return this.request(`/${resource}/${id}`, {
			method: "PUT",
			body: JSON.stringify(payload)
		});
	},

	deleteResource(resource, id) {
		return this.request(`/${resource}/${id}`, {
			method: "DELETE"
		});
	},

	adminUsers() {
		return this.request("/admin/users");
	},

	createAdminUser(payload) {
		return this.request("/admin/users", {
			method: "POST",
			body: JSON.stringify(payload)
		});
	},

	updateAdminUser(id, payload) {
		return this.request(`/admin/users/${id}`, {
			method: "PUT",
			body: JSON.stringify(payload)
		});
	},

	deleteAdminUser(id) {
		return this.request(`/admin/users/${id}`, {
			method: "DELETE"
		});
	},

	logout() {
		return this.request("/logout", { method: "POST" });
	}
};

window.EducInspectApi = EducInspectApi;
