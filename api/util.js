function notFound() { return { error: "Nenalezeno", status: 404 }; }
function badRequest(text) { return { error: text, status: 400 }; }

async function makeResponse(req) {
    defineFunction(req, "makeResponse", (json) => {
        req.response = new Response(JSON.stringify(json), {
            headers: { "Content-Type": "application/json" },
            status: json.status
        });
    });
}

async function jsonify(req) {
    let json;
    try { json = await req.json();
    } catch (error) { req.makeResponse(badRequest(error.message)); }
    if (json == null) { req.makeResponse(badRequest("JSON nesmí být null")); }

    req.json = json;
}

async function path(req) {
    req.path = new URL(req.url).pathname.split("/").slice(1);
}

function defineFunction(obj, name, func) {
    Object.defineProperty(obj, name, {value: (...args) => { return func.apply(obj, args); }});
}

export { makeResponse, defineFunction, jsonify, notFound, badRequest, path };