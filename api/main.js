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
            let response = await env.DB.prepare("SELECT UserId, HesloHash, Salt FROM Ucet WHERE Email = ?")
                                                                            .bind(json.email).run();
            response.status = 200;
            return response;
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