function normalizeList(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
}

function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}

async function fetchResourceItem(resource, id) {
    if (resource === "users") {
        const users = normalizeList(await window.EducInspectApi.adminUsers());
        return users.find((item) => String(item.id) === String(id));
    }

    try {
        return await window.EducInspectApi.request(`/${resource}/${id}`);
    } catch (error) {
        const items = normalizeList(await window.EducInspectApi.list(resource));
        return items.find((item) => String(item.id) === String(id));
    }
}

async function loadSelectOptions(resource, form) {
    if (!form) return;

    if (resource === "communes") {
        const departments = normalizeList(await window.EducInspectApi.list("departments"));
        const select = form.querySelector("[name='department_id']");
        if (!select) return;
        select.innerHTML = `
            <option value="">Sélectionner un département</option>
            ${departments.map((item) => `<option value="${item.id}">${item.name}</option>`).join("")}
        `;
        return;
    }

    if (resource === "schools") {
        const communes = normalizeList(await window.EducInspectApi.list("communes"));
        const communeSelect = form.querySelector("[name='commune_id']");
        if (communeSelect) {
            communeSelect.innerHTML = `
                <option value="">Sélectionner une commune</option>
                ${communes.map((item) => `<option value="${item.id}">${item.name}</option>`).join("")}
            `;
        }
        const userSelect = form.querySelector("[name='user_id']");
        if (userSelect) {
            const users = normalizeList(await window.EducInspectApi.adminUsers());
            let schoolUsers = users.filter((item) => Array.isArray(item.roles) && item.roles.some((role) => String(role.name).toLowerCase() === "directeur_ecole"));
            if (!schoolUsers.length) {
                schoolUsers = users;
            }
            userSelect.innerHTML = `
                <option value="">Sélectionner un compte utilisateur</option>
                ${schoolUsers.map((item) => `<option value="${item.id}">${item.name} (${item.email})</option>`).join("")}
            `;
        }
        return;
    }

    if (resource === "inspectors") {
        const users = normalizeList(await window.EducInspectApi.adminUsers());
        const select = form.querySelector("[name='user_id']");
        if (!select) return;
        select.innerHTML = `
            <option value="">Sélectionner un compte utilisateur</option>
            ${users.map((item) => `<option value="${item.id}">${item.name} (${item.email})</option>`).join("")}
        `;
        return;
    }
}

function normalizeUserRole(role) {
    if (!role) return role;
    const normalized = String(role).trim().toLowerCase();
    if (normalized === "directeur" || normalized === "direction" || normalized === "directeur_departemental") {
        return "directeur_departemental";
    }
    if (normalized === "directeur_ecole") {
        return "directeur_ecole";
    }
    return normalized;
}

function buildFormPayload(form, resource) {
    const payload = Object.fromEntries(new FormData(form).entries());
    if (payload.fullName) {
        payload.name = payload.fullName;
        delete payload.fullName;
    }
    if (resource === "users") {
        if (payload.role) {
            payload.role = normalizeUserRole(payload.role);
        }
        if (!payload.password) {
            delete payload.password;
        }
    }
    if (resource !== "users" && payload.password === "") {
        delete payload.password;
    }
    return payload;
}

async function populateForm(form, resource, item) {
    if (!item) return;
    Object.entries(item).forEach(([key, value]) => {
        const fieldName = key === "name" && resource === "users" ? "fullName" : key;
        const element = form.elements.namedItem(fieldName) || form.elements.namedItem(key);
        if (!element) return;
        element.value = value ?? "";
    });

    if (resource === "schools" || resource === "inspectors") {
        const userField = form.elements.namedItem("user_id");
        if (userField) {
            if (item.user?.id) {
                userField.value = item.user.id;
            } else if (item.user_id) {
                userField.value = item.user_id;
            }
        }
    }

    if (resource === "users" && Array.isArray(item.roles) && item.roles.length) {
        const roleElement = form.elements.namedItem("role");
        if (roleElement) {
            roleElement.value = item.roles[0].name;
        }
    }

    const title = document.querySelector(".form-title");
    if (title) {
        title.textContent = title.textContent.toLowerCase().includes("modifier") ? title.textContent : title.textContent.replace(/(nouveau|nouvelle) /i, "Modifier ");
    }
    const submitButton = form.querySelector("button[type='submit']");
    if (submitButton) {
        submitButton.innerHTML = `<span class="ti-save"></span> Mettre à jour`;
    }
}

async function handleFormSubmit(event, resource, form, listPage, itemId) {
    event.preventDefault();
    const payload = buildFormPayload(form, resource);

    if (resource === "users" && !itemId && !payload.password) {
        payload.password = "password";
    }

    try {
        if (itemId) {
            if (resource === "users") {
                await window.EducInspectApi.updateAdminUser(itemId, payload);
            } else {
                await window.EducInspectApi.updateResource(resource, itemId, payload);
            }
            alert("Modification enregistrée avec succès.");
        } else {
            if (resource === "users") {
                await window.EducInspectApi.createAdminUser(payload);
            } else {
                await window.EducInspectApi.createResource(resource, payload);
            }
            alert("Création enregistrée avec succès.");
        }
        window.location.href = listPage;
    } catch (error) {
        alert(error.message || "Erreur lors de l'enregistrement.");
        console.error(error);
    }
}

async function initAdminResourceForm() {
    if (!window.EducInspectApi) return;
    const resource = document.body.dataset.resource;
    if (!resource) return;

    const config = {
        users: { formId: "addUserForm", listPage: "admin-utilisateurs.html" },
        departments: { formId: "addDepartmentForm", listPage: "admin-departements.html" },
        communes: { formId: "addCommuneForm", listPage: "admin-communes.html" },
        schools: { formId: "addSchoolForm", listPage: "admin-ecoles.html" },
        inspectors: { formId: "addInspectorForm", listPage: "admin-inspecteurs.html" }
    };

    const pageConfig = config[resource];
    if (!pageConfig) return;

    const form = document.getElementById(pageConfig.formId);
    if (!form) return;

    const itemId = getQueryParam("id");
    await loadSelectOptions(resource, form);
    if (itemId) {
        const item = await fetchResourceItem(resource, itemId);
        if (item) {
            await populateForm(form, resource, item);
        }
    }

    form.addEventListener("submit", async (event) => handleFormSubmit(event, resource, form, pageConfig.listPage, itemId));
}

window.addEventListener("DOMContentLoaded", initAdminResourceForm);
