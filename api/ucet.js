export default {
    ucet(path, request) {
        switch (path[0]) {
            case "prihlasit-se":
                let json = JSON.parse(request.body);
                json.status = 200;
                return json;
            default:
                return null;
        }
    }
}