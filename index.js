const { ServiceBroker } = require("moleculer");
const apiService = require("./services/api/api.service.js");
const UserService = require("./models/public/services/user.service.js");
const productService = require("./services/productService/product.service.js");
const cartService = require("./services/cartService/cart.service.js");
const orderService = require("./services/orderService/order.service.js");


const DbService = require("./models/public/services/db.user.service.js");
const dbProductService = require("./services/db/product.service.js");
const dbCartService = require("./services/db/db.cart.service.js");
const dbOrderService = require("./services/db/db.order.service.js");

const StaticService = require("./static.service.js"); 


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
broker.createService(apiService);
broker.createService(UserService);
broker.createService(productService);
broker.createService(cartService);
broker.createService(orderService);


broker.createService(dbCartService);
broker.createService(dbOrderService);
broker.createService(dbProductService);
broker.createService(DbService);

broker.createService(StaticService);

broker.start()
    .then(() => {
        console.log("Broker started");
        broker.repl();
    })
    .catch(err => {
        console.error("Error starting broker:", err);
    });
