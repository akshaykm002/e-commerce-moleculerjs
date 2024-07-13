const { ServiceBroker } = require("moleculer");
const ApiService = require("./models/public/services/api.service.js");
const UserService = require("./models/public/services/user.service.js");
const DbService = require("./models/public/services/db.user.service.js");
const StaticService = require("./static.service.js"); // Import the static service
const productService = require("./services/productService/product.service.js");

const broker = new ServiceBroker({
    namespace: "",
    nodeID: "node-1",
    transporter: "NATS",
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
});

// Register services
broker.createService(ApiService);
broker.createService(UserService);
broker.createService(DbService);
broker.createService(StaticService);
broker.createService(productService); // Register the static service
 // Register the static service

broker.start()
    .then(() => {
        console.log("Broker started");
        broker.repl();
    })
    .catch(err => {
        console.error("Error starting broker:", err);
    });
