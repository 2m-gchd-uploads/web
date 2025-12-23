const TEMPLATE = '<header class="p-3 mb-3 border-bottom"><div class="container"><div class="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start"><ul class="nav col-12 col-lg-auto me-lg-auto justify-content-center"></ul><div><a class="text-reset bi bi-person-fill fs-4" data-bs-toggle="dropdown"></a><ul class="dropdown-menu text-small"></ul></div></div></div></header>';
const LINKS = {"Domů": "/"};
const ACCOUNT_LINKS_OUT = {"Přihlásit se": "/ucet/prihlasit-se"};
const ACCOUNT_LINKS_IN = {"Domů": "/", "DIVIDER": "", "Odhlásit se": "javascript:odhlasit()"};

function constructMenuLink(name, href) {
    let element = document.createElement("li");
    element.append(document.createElement("a"));
    element.firstChild.href = href;
    element.firstChild.innerText = name;
    element.firstChild.classList.add("nav-link");
    element.firstChild.classList.add("px-2");
    if (window.location.pathname == href) {
        element.firstChild.classList.add("link-secondary");
    } else {
        element.firstChild.classList.add("link-body-emphasis");
    }
    return element;
}

function constructAccountLink(name, href) {
    let element = document.createElement("li");
    if (name != "DIVIDER") {
        element.append(document.createElement("a"));
        element.firstChild.href = href;
        element.firstChild.innerText = name;
        element.firstChild.classList.add("dropdown-item");
    } else {
        element.append(document.createElement("hr"));
        element.firstChild.classList.add("dropdown-divider");
    }
    return element;
}

document.addEventListener("DOMContentLoaded", async () => {
    let element = document.createElement("div");
    element.innerHTML = TEMPLATE;
    element = element.firstChild;

    for (const [name, href] of Object.entries(LINKS)) {
        element.firstChild.firstChild.firstChild.appendChild(constructMenuLink(name, href));
    }

    let token = await window.cookieStore.get("token");
    const ACCOUNT_LINKS = (token != null) ? ACCOUNT_LINKS_IN : ACCOUNT_LINKS_OUT;

    for (const [name, href] of Object.entries(ACCOUNT_LINKS)) {
        element.firstChild.firstChild.lastChild.lastChild.appendChild(constructAccountLink(name, href));
    }

    document.body.prepend(element);

    let link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css";
    document.head.append(link);
    let script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js";
    document.body.append(script);
});