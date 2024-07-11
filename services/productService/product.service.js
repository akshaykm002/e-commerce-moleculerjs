const DbService = require("moleculer-db");
const path = require('path');
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
				id: { type: "string", },
			},
			async handler(ctx) {
				try {
					const productId = ctx.params.id;
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
			async handler(ctx) {
				try {
					if (!ctx.meta.token) {
						throw new MoleculerError(
							"No token provided",
							401,
							"NO_TOKEN"
						);
					}

					const decoded = jwt.verify(
						ctx.meta.token,
						this.settings.JWT_SECRET
					);

					const { userRole } = decoded;

					if (userRole !== "admin") {
						throw new MoleculerError(
							"Unauthorized",
							401,
							"UNAUTHORIZED"
						);
					}

					// Process form data and file upload
					await new Promise((resolve, reject) => {
						upload.single("image")(ctx.meta.$req, ctx.meta.$res, (err) => {
							if (err) return reject(err);
							resolve();
						});
					});

					const { name, description, price, stock } = ctx.meta.$req.body;

					let imageUrl = ctx.meta.$req.file.path;
					imageUrl = `http://localhost/uploads/${path.basename(imageUrl)}`;

					const product = await ctx.call("products.create", {
						name,
						description,
						price: parseFloat(price),
						stock: parseInt(stock),
						imageUrl,
					});
					return product;

				} catch (error) {
					console.error("Error during product creation:", error);
					throw new MoleculerError(
						"Unable to create product",
						500,
						"CREATE_ERROR",
						{ error }
					);
				}
			},
		},
		updateProductById: {
            params: {
                id: { type: "string" },
            },
            async handler(ctx) {
                try {
                    if (!ctx.meta.token) {
                        throw new MoleculerError("No token provided", 401, "NO_TOKEN");
                    }

                    const decoded = jwt.verify(ctx.meta.token, this.settings.JWT_SECRET);
                    const { userRole } = decoded;

                    if (userRole !== "admin") {
                        throw new MoleculerError("Unauthorized", 401, "UNAUTHORIZED");
                    }

                    await new Promise((resolve, reject) => {
                        upload.single("image")(ctx.meta.$req, ctx.meta.$res, (err) => {
                            if (err) return reject(err);
                            resolve();
                        });
                    });

                    const updateData = {};
                    ["name", "description", "price", "stock"].forEach((key) => {
                        if (ctx.meta.$req.body[key] !== undefined) {
                            updateData[key] = ctx.meta.$req.body[key];
                        }
                    });

                    if (ctx.meta.$req.file) {
                        let imageUrl = ctx.meta.$req.file.path;
                        imageUrl = imageUrl.split(path.sep).join("/");
                        updateData.imageUrl = imageUrl;
                    }

                    const updatedProduct = await ctx.call("products.update", {
                        id: ctx.params.id,
                        ...updateData,
                    });
                    if (!updatedProduct) {
                        throw new MoleculerError("Product not found", 404, "NOT_FOUND");
                    }
                    return updatedProduct;
                } catch (error) {
                    throw new MoleculerError("Unable to update product", 500, "UPDATE_ERROR", { error });
                }
            },
        },
		deleteProductById: {
			params: {
				id: { type: "string"},
			},
			async handler(ctx) {
				try {
					if (!ctx.meta.token) {
						throw new MoleculerError("No token provided", 401, "NO_TOKEN");
					}

					const decoded = jwt.verify(ctx.meta.token, this.settings.JWT_SECRET);
					const { userRole } = decoded;

					if (userRole !== "admin") {
						throw new MoleculerError("Unauthorized", 401, "UNAUTHORIZED");
					}

					const deletedProduct = await ctx.call("products.remove", { id: ctx.params.id });
					if (!deletedProduct) {
						throw new MoleculerError("Product not found", 404, "NOT_FOUND");
					}
					return { message: "Product deleted successfully" };
				} catch (error) {
					throw new MoleculerError("Unable to delete product", 500, "DELETE_ERROR", { error });
				}
			},
		},
	},
	started() {
		console.log("Product service started");
	},
};
