const TEMPLATE = '<header class="p-3 mb-3 border-bottom"><div class="container"><div class="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start"><ul class="nav col-12 col-lg-auto me-lg-auto justify-content-center"></ul><div><a class="text-reset bi bi-person-fill fs-4" data-bs-toggle="dropdown"></a><ul class="dropdown-menu text-small"><li><a class="dropdown-item" href="#">New project...</a></li><li><a class="dropdown-item" href="#">Settings</a></li><li><a class="dropdown-item" href="#">Profile</a></li><li><hr class="dropdown-divider"></li><li><a class="dropdown-item" href="#">Sign out</a></li></ul></div></div></div></header>';
const LINKS = {"Domů": "/", "Přihlásit se": "/ucet/prihlasit-se"};

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

document.addEventListener("DOMContentLoaded", () => {
    let element = document.createElement("div");
    element.innerHTML = TEMPLATE;
    element = element.firstChild;
    for (const [name, href] of Object.entries(LINKS)) {
        element.firstChild.firstChild.firstChild.appendChild(constructMenuLink(name, href));
    }
    document.body.prepend(element);
});