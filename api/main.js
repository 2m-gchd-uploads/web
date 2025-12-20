function ucet(path, json) {
    switch (path[0]) {
        case "prihlasit-se":
            json.status = 200;
            return json;
        default:
            return null;
    }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url).pathname.split("/").slice(1);

    if (url[0] == "api") {
        let response, json;
        try {
            json = await (new Response(request.body).json());
        } catch (error) {
            return new Response(JSON.stringify({error: error.message}), {
                headers: { "Content-Type": "application/json" },
                status: 400   // 400 Bad Request
            });
        }
        switch (url[1]) {
            case "ucet":
                response = ucet(url.slice(2), json);
                break;
        }
        if (response == null) { response = { error: "Nenalezeno", status: 404 }; }
        return new Response(JSON.stringify(response), {
            headers: { "Content-Type": "application/json" },
            status: response.status
        });
    }

    return env.ASSETS.fetch(request); // Show 404 error
  }
};