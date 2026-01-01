async function poznavackaUlozit(uuid, nazev, data) {
    let response;
    try {
        response = await fetch(`/poznavacka/${uuid}`, {method: "PUT",
            body: JSON.stringify({
                token: (await window.cookieStore.get("token")).value,
                nazev: nazev,
                data: data
            })});
    } catch {
        throw "Chyba při odesílání požadavku (zkontrolujte připojení k internetu)";
    }

    let json = await response.json();

    if (!response.ok) {
        throw json.error;
    }
}

async function zmenaHesla(heslo) {
    let response;
    try {
        response = await fetch("/api/ucet/zmena-hesla", {method: "POST",
            body: JSON.stringify({token: (await window.cookieStore.get("token")).value, password: heslo})});
    } catch {
        throw "Chyba při odesílání požadavku (zkontrolujte připojení k internetu)";
    }

    let json = await response.json();

    if (!response.ok) {
        throw json.error;
    }
}

async function resetHeslaToken(email, kod) {
    let response;
    try {
        response = await fetch("/api/ucet/reset-hesla-token", {
            method: "POST",
            body: JSON.stringify({ email: email, kod: kod })});
    } catch {
        throw "Chyba při odesílání požadavku (zkontrolujte připojení k internetu)";
    }

    let json = await response.json();

    if (!response.ok) {
        throw json.error;
    }

    await window.cookieStore.set("token", json.token);
}

async function resetHeslaKod(email) {
    let response;
    try {
        response = await fetch("/api/ucet/reset-hesla-kod", {
            method: "POST",
            body: JSON.stringify({ email: email })});
    } catch {
        throw "Chyba při odesílání požadavku (zkontrolujte připojení k internetu)";
    }

    let json = await response.json();

    if (!response.ok) {
        throw json.error;
    }
}

async function prihlasit(email, heslo) {
    let response;
    try {
        response = await fetch("/api/ucet/prihlasit-se", {method: "POST",
                            body: JSON.stringify({email: email, password: heslo})});
    } catch {
        throw "Chyba při odesílání požadavku (zkontrolujte připojení k internetu)";
    }

    let json = await response.json();

    if (!response.ok) {
        throw json.error;
    }

    await window.cookieStore.set("token", json.token);
}

async function odhlasit() {
    await fetch("/api/ucet/odhlasit-se", {
        method: "POST",
        body: JSON.stringify({
            token: (await window.cookieStore.get("token")).value
        })})
    await window.cookieStore.delete("token");
    window.location.reload();
}