const DbService = require("moleculer-db");
const path = require('path');
const { MoleculerError } = require("moleculer").Errors;
const jwt = require("jsonwebtoken");
const upload = require("../../config/multer-config.js");
const cloudinary = require("../../config/cloudinary-config.js");



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

                    const result = await cloudinary.uploader.upload(ctx.meta.$req.file.path);

                    const imageUrl = result.secure_url;

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
					
					//construct a new object to store the updated data and use forEacg loop to update data based on key
					const updateData = {};
					["name", "description", "price", "stock"].forEach((key) => {
						if (ctx.meta.$req.body[key] !== undefined) {
							updateData[key] = ctx.meta.$req.body[key];
						}
					});
		
					if (ctx.meta.$req.file) {
						const filePath = ctx.meta.$req.file.path;
		
						const result = await cloudinary.uploader.upload(filePath, {
							folder: "uploads", 
						});
		
						updateData.imageUrl = result.secure_url;
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
		searchProducts: {
			params: {
				query: { type: "string", optional: true },
				priceMin: { type: "string", optional: true },
				priceMax: { type: "string", optional: true },
				sortBy: { type: "string", optional: true, values: ["name", "price"] },
				sortOrder: { type: "string", optional: true, values: ["asc", "desc"] },
			},
			async handler(ctx) {
				const { query, priceMin, priceMax, sortBy, sortOrder } = ctx.params;
		
				try {
					// Fetching all products
					let products = await ctx.call("products.find", {});
		
					// Applying filters
					if (query) {
						products = products.filter(product =>
							product.name.toLowerCase().includes(query.toLowerCase()) ||
							product.description.toLowerCase().includes(query.toLowerCase())
						);
					}
		
		
					if (priceMin !== undefined) {
						products = products.filter(product => parseFloat(product.price) >= parseFloat(priceMin));
					}
		
					if (priceMax !== undefined) {
						products = products.filter(product => parseFloat(product.price) <= parseFloat(priceMax));
					}
		
					// Apply sorting
					if (sortBy && sortOrder) {
						products.sort((a, b) => {
							const sortFieldA = a[sortBy];
							const sortFieldB = b[sortBy];
		
							if (sortOrder === "asc") {
								if (sortFieldA < sortFieldB) return -1;
								if (sortFieldA > sortFieldB) return 1;
								return 0;
							} else {
								if (sortFieldA > sortFieldB) return -1;
								if (sortFieldA < sortFieldB) return 1;
								return 0;
							}
						});
					}
		
					return products;
				} catch (error) {
					throw new MoleculerError(
						"Unable to search products",
						500,
						"SEARCH_ERROR",
						{ error }
					);
				}
			},
		},
		addReview: {
			params: {
			  productId: { type: "string" },
			  rating: { type: "number", min: 1, max: 5 },
			  comment: { type: "string", optional: true },
			},
			async handler(ctx) {
			  try {
				if (!ctx.meta.token) {
				  throw new MoleculerError("No token provided", 401, "NO_TOKEN");
				}
		  
				const decoded = jwt.verify(ctx.meta.token, this.settings.JWT_SECRET);
				const { userId } = decoded;
				const { productId, rating, comment } = ctx.params;
		  
				// Fetch user orders
				const userOrders = await ctx.call("orders.find", { query: { userId } });
		  
				// Check if userOrders is defined and not empty
				if (!userOrders || userOrders.length === 0) {
				  throw new MoleculerError("User has not purchased any products", 403, "NOT_PURCHASED");
				}
		  
				// Fetch the product
				const product = await ctx.call("products.get", { id: productId });
		  
				if (!product) {
				  throw new MoleculerError("Product not found", 404, "NOT_FOUND");
				}
		  
				// Prepare review object
				const review = {
				  userId,
				  rating,
				  comment,
				  createdAt: new Date(),
				};
		  
				// Add review to product reviews array
				product.reviews = product.reviews || [];
				product.reviews.push(review);
		  
				// Update the product with the new review
				const updatedProduct = await ctx.call("products.update", {
				  id: productId,
				  reviews: product.reviews,
				});
		  
				const { rating: reviewRating, userId: reviewUserId, createdAt: reviewCreatedAt } = review;
		  
				return {
				  message: "Review added successfully",
				  review: {
					rating: reviewRating,
					userId: reviewUserId,
					comment: comment || "", 
					createdAt: reviewCreatedAt,
				  },
				  updatedProduct,
				};
			  } catch (error) {
				throw new MoleculerError("Unable to add review", 500, "ADD_REVIEW_ERROR", { error });
			  }
			},
		  },
		  
		    
	  
		  getReviews: {
			params: {
			  id: { type: "string" }
			},
			async handler(ctx) {
			  try {
				const { id } = ctx.params;
		  
				// Fetch the product to get its reviews
				const product = await ctx.call("products.get", { id });
		  
				if (!product) {
				  throw new MoleculerError("Product not found", 404, "NOT_FOUND");
				}
		  
				// Fetch user information for each review's userId
				const reviewsWithDetails = await Promise.all(product.reviews.map(async review => {
				  const user = await ctx.call("users.get", { id: review.userId });
				  return {
					rating: review.rating,
					userId: review.userId,
					username: user.username,  
					comment: review.comment || "", 
					createdAt: review.createdAt
				  };
				}));
		  
				// Return the reviews with details
				return {
				  message: `Reviews for product with ID ${id}`,
				  reviews: reviewsWithDetails
				};
			  } catch (error) {
				throw new MoleculerError("Unable to fetch reviews", 500, "FETCH_REVIEWS_ERROR", { error });
			  }
			},
		  },
		  
				
			
	},
	started() {
		console.log("Product service started");
	},
};
