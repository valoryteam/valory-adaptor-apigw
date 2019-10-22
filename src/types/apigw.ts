export interface FormattedRequest {
    method: string;
    url: string;
    queryStringParameters: {};
    headers: {[key: string]: string};
    body: string;
    isBase64Encoded: boolean;
    context: Context;
    requestContext: APIGatewayEventRequestContext;
}

export interface Context {
    // Properties
    callbackWaitsForEmptyEventLoop: boolean;
    functionName: string;
    functionVersion: string;
    invokedFunctionArn: string;
    memoryLimitInMB: number;
    awsRequestId: string;
    logGroupName: string;
    logStreamName: string;
    identity?: CognitoIdentity;
    clientContext?: ClientContext;

    // Functions
    getRemainingTimeInMillis(): number;

    // Functions for compatibility with earlier Node.js Runtime v0.10.42
    // For more details see http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-using-old-runtime.html#nodejs-prog-model-oldruntime-context-methods
    done(error?: Error, result?: any): void;
    fail(error: Error | string): void;
    succeed(messageOrObject: any): void;
    succeed(message: string, object: any): void;
}

export interface CognitoIdentity {
    cognitoIdentityId: string;
    cognitoIdentityPoolId: string;
}

export interface ClientContext {
    client: ClientContextClient;
    custom?: any;
    env: ClientContextEnv;
}

export interface ClientContextClient {
    installationId: string;
    appTitle: string;
    appVersionName: string;
    appVersionCode: string;
    appPackageName: string;
}

export interface ClientContextEnv {
    platformVersion: string;
    platform: string;
    make: string;
    model: string;
    locale: string;
}

export interface APIGatewayProxyEvent {
    body: string | null;
    headers: { [name: string]: string };
    multiValueHeaders: { [name: string]: string[] };
    httpMethod: string;
    isBase64Encoded: boolean;
    path: string;
    pathParameters: { [name: string]: string } | null;
    queryStringParameters: { [name: string]: string } | null;
    multiValueQueryStringParameters: { [name: string]: string[] } | null;
    stageVariables: { [name: string]: string } | null;
    requestContext: APIGatewayEventRequestContext;
    resource: string;
}

export interface APIGatewayEventRequestContext {
    accountId: string;
    apiId: string;
    authorizer?: AuthResponseContext | null;
    connectedAt?: number;
    connectionId?: string;
    domainName?: string;
    domainPrefix?: string;
    eventType?: string;
    extendedRequestId?: string;
    httpMethod: string;
    identity: {
        accessKey: string | null;
        accountId: string | null;
        apiKey: string | null;
        apiKeyId: string | null;
        caller: string | null;
        cognitoAuthenticationProvider: string | null;
        cognitoAuthenticationType: string | null;
        cognitoIdentityId: string | null;
        cognitoIdentityPoolId: string | null;
        sourceIp: string;
        user: string | null;
        userAgent: string | null;
        userArn: string | null;
    };
    messageDirection?: string;
    messageId?: string | null;
    path: string;
    stage: string;
    requestId: string;
    requestTime?: string;
    requestTimeEpoch: number;
    resourceId: string;
    resourcePath: string;
    routeKey?: string;
}

export interface APIGatewayProxyResult {
    statusCode: number;
    headers?: {
        [header: string]: boolean | number | string;
    };
    multiValueHeaders?: {
        [header: string]: Array<boolean | number | string>;
    };
    body: string;
    isBase64Encoded?: boolean;
}

export interface AuthResponseContext {
    [name: string]: any;
}

export type Callback<TResult = any> = (error?: Error | null | string, result?: TResult) => void;
