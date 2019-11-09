import FMW = require("find-my-way");
import {ApiRequest, ApiResponse, ApiServer, HttpMethod, ValoryMetadata} from "valory-runtime";
import {
    APIGatewayEventRequestContext,
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
    Callback,
    Context,
    FormattedRequest,
} from "./types/apigw";
import qs = require("querystring");

const pathReplacer = /{([\S]*?)}/g;
const default404: APIGatewayProxyResult = {
    statusCode: 404,
    isBase64Encoded: false,
    headers: {
        "Content-Type": "application/json",
    },
    body: '{"message": "Not Found"}',
};

export class APIGWAdaptor implements ApiServer {
    public static LambdaContextKey = ApiRequest.createKey<Context>();
    public static APIGWContextKey = ApiRequest.createKey<APIGatewayEventRequestContext>();
    public allowDocSite = true;
    public disableSerialization = false;
    public locallyRunnable = false;
    private router = FMW<FormattedRequest, Callback<APIGatewayProxyResult>>({
        defaultRoute(req, cb) {
            cb(null, default404);
        },
    });

    public register(path: string, method: HttpMethod, handler: (request: ApiRequest) => (Promise<ApiResponse>)) {
        const route = `${path}:${method}`;
        this.router.on(HttpMethod[method], path.replace(pathReplacer, ":$1"), (request, callback, params) => {
            const content = (request.isBase64Encoded) ? Buffer.from("base64").toString() : request.body;
            const parsed = attemptParse(request.headers["content-type"], content);
            const tranRequest = new ApiRequest({
                headers: request.headers,
                query: request.queryStringParameters,
                path: params,
                body: parsed,
                rawBody: content,
                formData: parsed as any,
                route,
            });
            tranRequest.putAttachment(APIGWAdaptor.LambdaContextKey, request.context);
            tranRequest.putAttachment(APIGWAdaptor.APIGWContextKey, request.requestContext);

            handler(tranRequest).then((response) => {
                const resContentType = response.headers["Content-Type"] || "text/plain";
                callback(null, {
                    isBase64Encoded: false,
                    body: serialize(resContentType, response.body),
                    headers: response.headers,
                    statusCode: response.statusCode,
                });
            });
        });
    }

    public getExport(metadata: ValoryMetadata, options: any): { valory: ValoryMetadata } {
        // embed the lambda request handler in the export
        return {
            valory: metadata,
            handler: this.handler.bind(this),
        } as any;
    }

    public shutdown() {
        // This should never be called
    }

    private handler(event: APIGatewayProxyEvent, ctx: Context, cb: Callback<APIGatewayProxyResult>) {
        const path = (event.pathParameters?.proxy != null) ? "/" + event.pathParameters.proxy : event.path;

        const formatted: FormattedRequest = {
            requestContext: event.requestContext,
            context: ctx,
            body: event.body || "",
            headers: lowercaseKeys(event.headers),
            method: event.httpMethod,
            isBase64Encoded: event.isBase64Encoded,
            queryStringParameters: event.queryStringParameters || {},
            url: path,
        };
        this.router.lookup(formatted, cb);
    }
}

function lowercaseKeys(object: { [key: string]: string }) {
    const keys = Object.keys(object);
    const obj: { [key: string]: string } = {};
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        obj[key.toLowerCase()] = object[key];
    }
    return obj;
}

function attemptParse(contentType: string, obj: any): any {
    if (contentType == null) {
        return obj;
    }
    const parsedContentType = contentType.split(";")[0];
    try {
        switch (parsedContentType) {
            case "application/json":
                return JSON.parse(obj);
            case "application/x-www-form-urlencoded":
                return qs.parse(obj);
            default:
                return obj;
        }
    } catch (err) {
        return obj;
    }
}

function serialize(contentType: string, data: any): string {
    if (data == null) {
        return "";
    } else if (typeof data !== "string") {
        return JSON.stringify(data);
    } else {
        return data;
    }
}
