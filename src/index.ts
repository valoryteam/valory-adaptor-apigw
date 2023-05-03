import FMW = require("find-my-way");
import {ApiRequest, ApiContext, ApiAdaptor, AttachmentRegistry, HttpMethod} from "valory-runtime";
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

export class APIGWAdaptor implements ApiAdaptor {
    public static LambdaContextKey = AttachmentRegistry.createKey<Context>();
    public static APIGWContextKey = AttachmentRegistry.createKey<APIGatewayEventRequestContext>();
    public static Base64EncodedKey = AttachmentRegistry.createKey<boolean>();
    public static Base64EncodeResponseKey = AttachmentRegistry.createKey<boolean>();
    public allowDocSite = true;
    public disableSerialization = false;
    public locallyRunnable = false;
    private router = FMW<FormattedRequest, Callback<APIGatewayProxyResult>>({
        defaultRoute(req, cb) {
            cb(null, default404);
        },
    });

    public register(path: string, method: HttpMethod, handler: (ctx: ApiContext) => Promise<ApiContext>): void {
        this.router.on(method, path.replace(pathReplacer, ":$1"), async (request, callback, params) => {
            const tranRequest = new ApiContext({
                headers: request.headers,
                pathParams: params,
                rawBody: request.body,
                method,
                path,
                query: qs.stringify(request.queryStringParameters, undefined, undefined),
                requestId: request.context.awsRequestId
            });
            tranRequest.attachments.putAttachment(APIGWAdaptor.Base64EncodedKey, request.isBase64Encoded);
            tranRequest.attachments.putAttachment(APIGWAdaptor.APIGWContextKey, request.requestContext);
            tranRequest.attachments.putAttachment(APIGWAdaptor.LambdaContextKey, request.context);

            await handler(tranRequest);

            const base64EncodeResponse = tranRequest.attachments.getAttachment(APIGWAdaptor.Base64EncodeResponseKey) || false;
            const headers = tranRequest.prepareHeaders();

            callback(null, {
               isBase64Encoded: base64EncodeResponse,
               body: (base64EncodeResponse) ? Buffer.from(tranRequest.serializeResponse()).toString("base64") : tranRequest.serializeResponse().toString(),
               headers,
               statusCode: tranRequest.response.statusCode,
            });
        });
    }

    public start() {
        // embed the lambda request handler in the export
        return {
            handler: this.handler.bind(this),
        };
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
            url: path.replace(getPrefix(), ""),
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

function getPrefix(): string {
    if (!process.env.PATH_PREFIX) {
        throw new Error(`PATH_PREFIX undefined.`);
    }
    return process.env.PATH_PREFIX;
}
