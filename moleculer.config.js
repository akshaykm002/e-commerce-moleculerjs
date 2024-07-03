module.exports = {
    namespace: "",
	nodeID: "node-" + process.pid,
    transporter: {
        type: "NATS",
        options: {
            url: "nats://localhost:4222", 
        },
    requestTimeout: 10 * 1000,
    retryPolicy: {
        enabled: false,
    },
    maxCallLevel: 100,
    heartbeatInterval: 5,
    heartbeatTimeout: 15,
    contextParamsCloning: false,
    cacher: "Memory",
    serializer: "JSON",
    logger: true,
    logLevel: "info",
    logFormatter: "default",
    logObjectPrinter: null,
    disableBalancer: false,
    registry: {
        strategy: "RoundRobin",
        preferLocal: true
    },
    circuitBreaker: {
        enabled: false,
        threshold: 0.5,
        minRequestCount: 20,
        windowTime: 60,
        halfOpenTime: 10 * 1000,
        check: err => err && err.code >= 500
    },
    bulkhead: {
        enabled: false,
        concurrency: 10,
        maxQueueSize: 100
    },
    validator: true,
    errorHandler: null,
    metrics: {
        enabled: false,
        reporter: {
            type: "Console",
            options: {
                colors: true,
                logger: null,
                base: null,
                interval: 5,
                includes: null,
                excludes: ["moleculer.metrics.*"]
            }
        }
    },
    tracing: {
        enabled: false,
        exporter: {
            type: "Console",
            options: {
                colors: true,
                logger: null,
                base: null,
                interval: 5,
                includes: null,
                excludes: ["moleculer.tracing.*"]
            }
        }
    },
    middlewares: [],
    replCommands: null,
    created(broker) {
    },
    started(broker) {
    },
    stopped(broker) {
    }
},
logger: true, // Enable built-in logger

};
