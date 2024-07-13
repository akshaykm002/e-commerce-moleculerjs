const { Service } = require("moleculer");
const ApiGateway = require("moleculer-web");

module.exports = {
    name: "static",
    mixins: [ApiGateway],
    settings: {
        port: process.env.PORT || 3000,
        routes: [
            {
                path: "/uploads",
                use: [
                    ApiGateway.serveStatic({
                        directory: "./uploads",
                        options: {},
                    }),
                ],
            },
        ],
    },
};
