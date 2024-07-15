const DbService = require("moleculer-db");
const { MoleculerError } = require("moleculer").Errors;
const jwt = require("jsonwebtoken");

module.exports = {
    name: "cart",

    mixins: [DbService],

    settings: {
        JWT_SECRET: process.env.ACCESS_TOKEN_SECRET, 
    },
    //Hook to extract JWT token from the request headers before every action
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
        getCart: {
            async handler(ctx) {
                try {
                    if (!ctx.meta.token) {
                        throw new MoleculerError("No token provided", 401, "NO_TOKEN");
                    }
        
                    const decoded = jwt.verify(ctx.meta.token, this.settings.JWT_SECRET);
                    const { userId } = decoded;
        
                    const cartItems = await ctx.call("db.cart.find", { query: { userId } });
        
                    // Filter out cart items with deleted products
                    const validCartItems = [];
                    for (const item of cartItems) {
                        try {
                            const product = await ctx.call("products.get", { id: item.productId });
                            if (product) {
                                validCartItems.push(item);
                            }
                        } catch (error) {
                            // Handle case where product does not exist
                            if (error.code === 404) {
                                
                                await ctx.call("db.cart.remove", { id: item.id });
                            } else {
                                throw error;
                            }
                        }
                    }
        
                    // Consolidate duplicate entries
                    const consolidatedCart = validCartItems.reduce((acc, item) => {
                        const existingItem = acc.find(i => i.productId === item.productId);
                        if (existingItem) {
                            existingItem.quantity += item.quantity;
                        } else {
                            acc.push({ ...item });
                        }
                        return acc;
                    }, []);
        
                    return { message: "User's cart", cartItems: consolidatedCart };
                } catch (error) {
                    throw new MoleculerError("Unable to fetch cart", 500, "FETCH_ERROR", { error });
                }
            },
        },
        
        

        addToCart: {
            params: {
                productId: { type: "string", optional: false },
                quantity: { type: "number", optional: true, default: 1 }
            },
            async handler(ctx) {
                try {
                    if (!ctx.meta.token) {
                        throw new MoleculerError("No token provided", 401, "NO_TOKEN");
                    }

                    const decoded = jwt.verify(ctx.meta.token, this.settings.JWT_SECRET);
                    const { userId } = decoded;

                    const { productId } = ctx.params;
                    let { quantity } = ctx.params;

                    // Check if the product exists
                    const product = await ctx.call("products.get", { id: productId });
                    if (!product) {
                        throw new MoleculerError("Invalid product ID", 400, "INVALID_PRODUCT");
                    }

                    // Check if the product is already in the cart
                    const existingCartItem = await ctx.call("db.cart.find", {
                        query: { userId, productId }
                    });

                    let cartItem;
                    if (existingCartItem.length > 0) {
                        // If the product is already in the cart, update the quantity
                        const newQuantity = existingCartItem[0].quantity + (quantity || 1);
                        cartItem = await ctx.call("db.cart.update", {
                            id: existingCartItem[0].id,
                            quantity: newQuantity
                        });
                    } else {
                        // If the product is not in the cart, create a new cart item
                        cartItem = await ctx.call("db.cart.create", { userId, productId, quantity: quantity || 1 });
                    }

                    return { message: "Item added to cart", cartItem };
                } catch (error) {
                    throw new MoleculerError("Unable to add item to cart", 500, "CREATE_ERROR", { error });
                }
            },
        },

        updateCartItem: {
            params: {
                id: { type: "string", optional: false },
                quantity: { type: "number", optional: false }
            },
            async handler(ctx) {
                try {
                    if (!ctx.meta.token) {
                        throw new MoleculerError("No token provided", 401, "NO_TOKEN");
                    }

                    const decoded = jwt.verify(ctx.meta.token, this.settings.JWT_SECRET);
                    const { userId } = decoded;

                    const { id, quantity } = ctx.params;

                    // Find the cart item by id and userId
                    const cartItem = await ctx.call("db.cart.get", { id });

                    if (!cartItem || cartItem.userId !== userId) {
                        throw new MoleculerError("Cart item not found or not authorized", 404, "NOT_FOUND");
                    }

                    const updatedCartItem = await ctx.call("db.cart.update", {
                        id,
                        quantity
                    });

                    return { message: "Cart item updated", updatedCartItem };
                } catch (error) {
                    throw new MoleculerError("Unable to update cart item", 500, "UPDATE_ERROR", { error });
                }
            },
        },

        removeCartItem: {
            params: {
                id: { type: "string", optional: false }
            },
            async handler(ctx) {
                try {
                    if (!ctx.meta.token) {
                        throw new MoleculerError("No token provided", 401, "NO_TOKEN");
                    }

                    const decoded = jwt.verify(ctx.meta.token, this.settings.JWT_SECRET);
                    const { userId } = decoded;

                    const { id } = ctx.params;

                    // Find the cart item by id and userId
                    const cartItem = await ctx.call("db.cart.get", { id });

                    if (!cartItem || cartItem.userId !== userId) {
                        throw new MoleculerError("Cart item not found or not authorized", 404, "NOT_FOUND");
                    }

                    await ctx.call("db.cart.remove", { id });

                    return { message: "Cart item removed" };
                } catch (error) {
                    throw new MoleculerError("Unable to remove cart item", 500, "REMOVE_ERROR", { error });
                }
            },
        }
    },

    started() {
        console.log("Cart service started");
    },
};
