const DbService = require("moleculer-db");
const { MoleculerError } = require("moleculer").Errors;
const jwt = require("jsonwebtoken");
const upload = require("../../middlewares/multer-config.js");

module.exports = {
	name: "product",

	mixins: [DbService],

	settings: {
		JWT_SECRET: process.env.ACCESS_TOKEN_SECRET,


	},
	hooks: {
		before: {
			"*": [
				function (ctx) {
					const authHeader =
						ctx.meta.headers && ctx.meta.headers.authorization;
					if (authHeader) {
						const token = authHeader.split(" ")[1];
						ctx.meta.token = token;
					} else {
						ctx.meta.token = null;
					}
				},
			],
		},
	},

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
						`Unable to fetch product with this id `,
						500,
						"FETCH_ERROR",
						{ error }
					);
				}
			},
		},
		createNewProducts: {
			params: {
			  name: { type: "string", optional: false },
			  description: { type: "string", optional: false },
			  price: { type: "number", convert: true },
		 	  stock: { type: "number", convert: true }
			},
			async handler(ctx) {
			  try {
				// console.log("Recieved params",ctx.params);
				
	  
				if (!ctx.meta.token) {
				  throw new MoleculerError("No token provided", 401, "NO_TOKEN");
				}
	  
				const decoded = jwt.verify(ctx.meta.token, this.settings.JWT_SECRET);
				console.log("Decoded Token:", decoded);

				//destructured userRole from decoded token
				const { userRole } = decoded;
				console.log("User role:", userRole);
	  
				if (userRole !== 'admin') {
				  throw new MoleculerError('Unauthorized', 401, 'UNAUTHORIZED');
				}
				// console.log("upload ",upload);

				await new Promise((resolve, reject) => {
					upload.single('image')(ctx.meta.$req, ctx.meta.$res, (err) => {
					  if (err) return reject(err);
					  resolve();
					});
				  });
	  
				const { name, description, price, stock } = ctx.params;

				const imageUrl = ctx.meta.$req.file.path;

	  
				const product = await ctx.call('products.create', { name, description, price, imageUrl, stock });
				return product;
			  } catch (error) {
				console.error("Error during product creation:", error);
				throw new MoleculerError('Unable to create product', 500, 'CREATE_ERROR', { error });
			  }
			}
		  },
		


	  
		
	},
	started() {
		console.log("Product service started");
	},
};
