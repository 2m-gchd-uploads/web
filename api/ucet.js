import { Resend } from 'resend';

async function auth(req) {
    if (req.json.token == undefined) { return; }

    let response = await req.env.DB.prepare("SELECT UserId FROM Token WHERE Token = ?")
                                .bind(req.json.token).run();
    if (response.results.length == 0) { return; }

    req.userId = response.results[0].UserId;
}

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

async function ucet(req) {
    if (!(req.path[0] == "api" && req.path[1] == "ucet")) { return; }
    switch (req.path[2]) {
        case "prihlasit-se":
            if (req.json.email == undefined || req.json.password == undefined)
                                { req.makeResponse(badRequest("Chybějící pole v požadavku")); }
            const response = await req.env.DB.prepare("SELECT UserId, HesloHash, Salt FROM Ucet WHERE Email = ?")
                                                                            .bind(req.json.email).run();
            if (response.results.length == 0) { req.makeResponse({error: "Uživatel neexistuje", status: 401}); }
            const result = response.results[0];

            if (new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder()
            .encode(req.json.password + result.Salt))).toHex() == new Uint8Array(result.HesloHash).toHex()) {
                req.makeResponse({token: await generateToken(req.env, result.UserId), status: 200});
            }
            
            req.makeResponse({error: "Špatné heslo", status: 401});
        case "odhlasit-se":
            if (req.json.token == undefined) { req.makeResponse(badRequest("Chybějící pole v požadavku")); }
            if (await cancelToken(req.env, req.json.token)) {
                req.makeResponse({status: 200});
            } else {
                req.makeResponse({error: "Neplatný token", status: 401});
            }
        case "reset-hesla-kod":
            if (req.json.email == undefined) { req.makeResponse(badRequest("Chybějící pole v požadavku")); }
            let kod = "";
            for (let i = 0; i < 6; i++) { kod += Math.floor(Math.random() * 10).toString(); }
            if ((await req.env.DB.prepare("UPDATE Ucet SET HesloResetKod = ? WHERE Email = ?")
                        .bind(kod, req.json.email).run()).meta.changed_db) {
                const resend = new Resend(await req.env.RESEND_API_KEY.get());
                const { data, error } = await resend.emails.send({
                    from: "no-reply@2mgchd.qzz.io",
                    to: req.json.email,
                    subject: "Obnova hesla",
                    html: "<p>Kód pro obnovu hesla je <b>" + kod + "</b></p>"
                });
                if (!error) {
                    req.makeResponse({status: 200});
                } else {
                    req.makeResponse({error: "Chyba při odesílání emailu", status: 500});
                }
            } else {
                req.makeResponse({error: "Neplatný email", status: 401});
            }
        case "reset-hesla-token":
            if (req.json.email == undefined || req.json.kod == undefined)
                                    { req.makeResponse(badRequest("Chybějící pole v požadavku")); }
            if ((await req.env.DB.prepare("UPDATE Ucet SET HesloResetKod = NULL WHERE Email = ? AND HesloResetKod = ?")
                        .bind(req.json.email, req.json.kod.toString()).run()).meta.changed_db) {
                req.makeResponse({token: await generateToken(req.env, await getUserId(req.env, req.json.email)), status: 200});
            } else {
                req.makeResponse({error: "Neplatný kód", status: 401});
            }
        case "zmena-hesla":
            if (req.json.password == undefined)
                            { req.makeResponse(badRequest("Chybějící pole v požadavku")); }
            if (req.userId != null) {
                await changePassword(req.env, req.userId, req.json.password);
                req.makeResponse({status: 200});
            } else {
                req.makeResponse({error: "Neplatný token", status: 401});
            }
        default:
            req.makeResponse(notFound());
    }
}

export { auth, ucet };