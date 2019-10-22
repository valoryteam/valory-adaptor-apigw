declare module "find-my-way" {
    class Router<T, K> {
        public on(method: string | string[], path: string, handler: Handler<T, K>): void;
        public reset(): void;
        public lookup(req: T, res: K): void;
        public find(method: string, path: string, version?: string): Handler<T, K> | null;
        public prettyPrint(): string;
    }

    type Handler<T, K> = (req: T, res: K, params: {[name: string]: string}) => void;

    interface RouterOptions<T, K> {
        ignoreTrailingSlashes?: boolean;
        defaultRoute?: Handler<T, K>;
        maxParamLength?: number;
        allowUnsafeRegex?: boolean;
        caseSensitive?: boolean;
    }

    function createRouter<T, K>(options?: RouterOptions<T, K>): Router<T, K>;

    export = createRouter;
}
