export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url).pathname.split("/").slice(1);

    if (url[0] == "api") {
        let response;
        switch (url[1]) {
            case "ucet":
                response = ucet(url.slice(2), request);
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