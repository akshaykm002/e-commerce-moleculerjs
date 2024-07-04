const DbService = require("moleculer-db");
const { MoleculerError } = require("moleculer").Errors;
const upload = require("./multer-config.js");

module.exports = {
	name: "product",

	mixins: [DbService],

	settings: {},

	actions: {
		getAllProducts: {
			 async handler(ctx) {
				try {
					const products = await ctx.call("products.find", {});
					return { message: "List of all products", products };
				} catch (error) {
					throw new MoleculerError(
						"Unable to fetch products",
						500,
						"FETCH_ERROR",
						{ error }
					);
				}
			},
		},
		getProductById: {
			params: {
				id: { type: "number", convert: true },
			},
			async handler(ctx) {
				try {
					const productId = Number(ctx.params.id);
					const product = await ctx.call("products.get", {
						id: productId,
					});
					if (!product) {
						throw new MoleculerError(
							"Product not found",
							404,
							"NOT_FOUND"
						);
					}
					return product;

				} catch (error) {
					throw new MoleculerError(
						"Unable to fetch product",
						500,
						"FETCH_ERROR",
						{ error }
					);
				}
			},
		},
		
	},
	started() {
		console.log("Product service started");
	},
};
