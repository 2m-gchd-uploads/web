import { auth, ucet } from './ucet';
import { jsonify, makeResponse, notFound, badRequest, path } from './util';

export default {
  fetch(request, env, ctx) {
    return new Promise((resolve, reject) => {
        (async () => {            
            request.env = env;
            request.resolve = resolve;

            await makeResponse(request);
            await path(request);
            await jsonify(request);
            await auth(request);

            await ucet(request);

            return env.ASSETS.fetch(request); // Show 404 error

            const url = new URL(request.url).pathname.split("/").slice(1);

            if (url[0] == "api") {
                let json;

                try { json = await (new Response(request.body).json());
                } catch (error) { return makeResponse(badRequest(error.message)); }
                if (json == null) { return makeResponse(badRequest("JSON nesmí být null")); }

                switch (url[1]) {
                    case "ucet":
                        return makeResponse(await ucet(url.slice(2), json, env));
                    default:
                        return makeResponse(notFound());
                }
            }
        })().then(resolve, reject);
    })
  }
};