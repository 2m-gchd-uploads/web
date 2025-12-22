import { Resend } from 'resend';

async function generateToken(env, userId) {
    let array = [];
    for (let i = 0; i < 190; i++) { array.push(Math.floor(Math.random() * 256)); }
    let token = new Uint8Array(array).toBase64();
    await env.DB.prepare("INSERT INTO Token (Token, UserId) VALUES (?, ?)")
            .bind(token, userId).run();
    return token;
}

async function cancelToken(env, token) {
    return (await env.DB.prepare("DELETE FROM Token WHERE Token = ?").bind(token).run()).meta.changed_db;
}

async function getUserId(env, email) {
    let response = await env.DB.prepare("SELECT UserId FROM Ucet WHERE Email = ?").bind(email).run();
    if (response.results.length == 0) { return null; }
    return response.results[0].UserId;
}

async function checkToken(env, token) {
    let response = await env.DB.prepare("SELECT UserId FROM Token WHERE Token = ?").bind(token).run();
    if (response.results.length == 0) { return null; }
    return response.results[0].UserId;
}

async function changePassword(env, userId, password) {
    let salt = "";
    for (let i = 0; i < 16; i++) { salt += Math.floor(Math.random() * 36).toString(36); }
    let hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder()
            .encode(password + salt))));
    await env.DB.prepare("UPDATE Ucet SET HesloHash = ?, Salt = ? WHERE UserId = ?")
                        .bind(hash, salt, userId).run();
    await env.DB.prepare("DELETE FROM Token WHERE UserId = ?")
                        .bind(userId).run();;
}

function makeResponse(jsonResponse) {
    return new Response(JSON.stringify(jsonResponse), {
            headers: { "Content-Type": "application/json" },
            status: jsonResponse.status
        });
}

function notFound() { return { error: "Nenalezeno", status: 404 }; }
function badRequest(text) { return { error: text, status: 400 }; }

async function ucet(path, json, env) {
    switch (path[0]) {
        case "prihlasit-se":
            if (json.email == undefined || json.password == undefined)
                                    { return badRequest("Chybějící pole v požadavku"); }
            const response = await env.DB.prepare("SELECT UserId, HesloHash, Salt FROM Ucet WHERE Email = ?")
                                                                            .bind(json.email).run();
            if (response.results.length == 0) { return {error: "Uživatel neexistuje", status: 401}; }
            const result = response.results[0];

            if (new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder()
            .encode(json.password + result.Salt))).toHex() == new Uint8Array(result.HesloHash).toHex()) {
                return {token: await generateToken(env, result.UserId), status: 200};
            }
            
            return {error: "Špatné heslo", status: 401};
        case "odhlasit-se":
            if (json.token == undefined) { return badRequest("Chybějící pole v požadavku"); }
            if (await cancelToken(env, json.token)) {
                return {status: 200};
            } else {
                return {error: "Neplatný token", status: 401};
            }
        case "reset-hesla-kod":
            if (json.email == undefined) { return badRequest("Chybějící pole v požadavku"); }
            let kod = "";
            for (let i = 0; i < 6; i++) { kod += Math.floor(Math.random() * 10).toString(); }
            if ((await env.DB.prepare("UPDATE Ucet SET HesloResetKod = ? WHERE Email = ?")
                        .bind(kod, json.email).run()).meta.changed_db) {
                const resend = new Resend(await env.RESEND_API_KEY.get());
                const { data, error } = await resend.emails.send({
                    from: "no-reply@2mgchd.qzz.io",
                    to: json.email,
                    subject: "Obnova hesla",
                    html: "<p>Kód pro obnovu hesla je <b>" + kod + "</b></p>"
                });
                if (!error) {
                    return {status: 200};
                } else {
                    return {error: "Chyba při odesílání emailu", status: 500}
                }
            } else {
                return {error: "Neplatný email", status: 401};
            }
        case "reset-hesla-token":
            if (json.email == undefined || json.kod == undefined)
                                    { return badRequest("Chybějící pole v požadavku"); }
            if ((await env.DB.prepare("UPDATE Ucet SET HesloResetKod = NULL WHERE Email = ? AND HesloResetKod = ?")
                        .bind(json.email, json.kod.toString()).run()).meta.changed_db) {
                return {token: await generateToken(env, await getUserId(env, json.email)), status: 200};
            } else {
                return {error: "Neplatný kód", status: 401};
            }
        case "zmena-hesla":
            if (json.token == undefined || json.password == undefined)
                            { return badRequest("Chybějící pole v požadavku"); }
            let userId = await checkToken(env, json.token);
            if (userId != null) {
                await changePassword(env, userId, json.password);
                return {status: 200};
            } else {
                return {error: "Neplatný token", status: 401};
            }
        default:
            return notFound();
    }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url).pathname.split("/").slice(1);

    if (url[0] == "api") {
        let json;

        try { json = await (new Response(request.body).json());
        } catch (error) { return makeResponse(badRequest(error.message)); }
        if (json === null) { return makeResponse(badRequest("JSON nesmí být null")); }

        switch (url[1]) {
            case "ucet":
                return makeResponse(await ucet(url.slice(2), json, env));
            default:
                return makeResponse(notFound());
        }
    }

    return env.ASSETS.fetch(request); // Show 404 error
  }
};