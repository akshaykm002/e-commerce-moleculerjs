const ApiGateway = require("moleculer-web");
const bodyParser = require("body-parser");
const authenticateToken = require("../../middlewares/auth.middleware.js");
const path = require("path");
const serveStatic = require("serve-static");
require("dotenv").config();

module.exports = {
	name: "api",
	mixins: [ApiGateway, authenticateToken],

	settings: {
		port: process.env.PORT || 4000,
		routes: [
			{
				use: [
					bodyParser.json(),
					bodyParser.urlencoded({ extended: true }),
					serveStatic(path.join(__dirname, "../../uploads")),
				],
				// CORS Configuration
				cors: {
					origin: [
						"http://localhost:3000",
						"https://akshaykm002.github.io/e-commerce-react/",
					],
					methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
					allowedHeaders: ["Content-Type", "Authorization"],
					credentials: true,
					maxAge: 3600,
				},
				aliases: {
					// Users API
					"POST api/register": "user.register",
					"POST api/login": "user.login",
					"GET api/user": {
						action: "user.getUserByToken",
						onBeforeCall: [authenticateToken.localAction],
					},
					"POST api/logout": "user.logout",

					// Products API
					"GET api/products": "product.getAllProducts",
					"GET api/products/:id": "product.getProductById",
					"POST api/products": {
						action: "product.createNewProducts",
						onBeforeCall: [authenticateToken.localAction],
					},
					"PUT api/products/:id": {
						action: "product.updateProductById",
						onBeforeCall: [authenticateToken.localAction],
					},
					"DELETE api/products/:id": {
						action: "product.deleteProductById",
						onBeforeCall: [authenticateToken.localAction],
					},
					"GET api/products/search": "product.searchProducts",
					"POST api/products/review": {
						action: "product.addReview",
						onBeforeCall: [authenticateToken.localAction],
					},
					"GET api/products/review/:id": "product.getReviews",

					// Cart API
					"GET api/cart": {
						action: "cart.getCart",
						onBeforeCall: [authenticateToken.localAction],
					},
					"POST api/cart": {
						action: "cart.addToCart",
						onBeforeCall: [authenticateToken.localAction],
					},
					"PUT api/cart/:id": {
						action: "cart.updateCartItem",
						onBeforeCall: [authenticateToken.localAction],
					},
					"DELETE api/cart/:id": {
						action: "cart.removeCartItem",
						onBeforeCall: [authenticateToken.localAction],
					},

					// Orders API
					"POST api/orders": {
						action: "order.placeOrder",
						onBeforeCall: [authenticateToken.localAction],
					},
					"GET api/orders": {
						action: "order.getOrders",
						onBeforeCall: [authenticateToken.localAction],
					},
					"GET api/health": {
						handler(req, res) {
							res.end("API is up and running");
						},
					},
				},
				mappingPolicy: "all",
				bodyParsers: {
					json: true,
					urlencoded: { extended: true },
				},
				onBeforeCall(ctx, route, req) {
					ctx.meta.headers = req.headers;
					ctx.meta.tenantId = req.headers["tenant-id"];
					ctx.meta.$req = req;
					ctx.meta.$res = req.res;
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
