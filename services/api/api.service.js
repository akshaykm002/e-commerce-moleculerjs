const ApiGateway = require("moleculer-web");
const bodyParser = require("body-parser");
const cors = require("cors");
const authenticateToken = require("../../middlewares/auth.middleware.js");

module.exports = {
	name: "api",
	mixins: [ApiGateway, authenticateToken],

	settings: {
		port: process.env.PORT || 3000,
		routes: [
			{
				use: [
					cors(),
					bodyParser.json(),
					bodyParser.urlencoded({ extended: true }),
				],
				aliases: {
					//Users API
					"POST api/register": "user.register",
					"POST api/login": "user.login",
					"GET api/user": {
						action: "user.getUserByToken",
						onBeforeCall: [authenticateToken.localAction],
					},
					"POST api/logout": "user.logout",
					
					// Products API
					"GET api/products":"product.getAllProducts", 
					"GET api/products/:id":"product.getProductById",
					
				},
				mappingPolicy: "all",
				bodyParsers: {
					json: true,
					urlencoded: { extended: true },
				},
				onBeforeCall(ctx, route, req) {
					ctx.meta.headers = req.headers;
					ctx.meta.tenantId = req.headers["tenant-id"];
				},
			},
		],
	},
	transporter: "NATS",

	methods: {},

	started() {
		this.logger.info("API service started");
	},
};
