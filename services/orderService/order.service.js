const DbService = require("moleculer-db");
const { MoleculerError } = require("moleculer").Errors;
const jwt = require("jsonwebtoken");

module.exports = {
    name: "order",

    mixins: [DbService],

    settings: {
        JWT_SECRET: process.env.ACCESS_TOKEN_SECRET,
    },

    hooks: {
        before: {
            "*": [
                function (ctx) {
                    const authHeader = ctx.meta.headers && ctx.meta.headers.authorization;
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
        placeOrder: {
            async handler(ctx) {
                try {
                    if (!ctx.meta.token) {
                        throw new MoleculerError("No token provided", 401, "NO_TOKEN");
                    }

                    const decoded = jwt.verify(ctx.meta.token, this.settings.JWT_SECRET);
                    const { userId } = decoded;

                    // Fetch user's cart items
                    const cartItems = await ctx.call("cart.getCart", {});

                    if (cartItems.length === 0) {
                        throw new MoleculerError("Cart is empty", 400, "CART_EMPTY");
                    }

                    // Calculate the total price
                    let totalPrice = 0;
                    for (const item of cartItems.cartItems) {
                        const product = await ctx.call("product.getProductById", { id: item.productId });
                        totalPrice += product.price * item.quantity;
                    }

                    // Create the order
                    const order = await ctx.call("orders.create", {
                        userId,
                        totalPrice,
                        status: 'pending'
                    });

                    // Clear user's cart after placing the order
                    for (const item of cartItems.cartItems) {
                        await ctx.call("cart.removeCartItem", { id: item.id });
                    }

                    return { message: "Order placed successfully", order };
                } catch (error) {
                    throw new MoleculerError("Unable to place order", 500, "PLACE_ORDER_ERROR", { error });
                }
            },
        },

        getOrders: {
            async handler(ctx) {
                try {
                    if (!ctx.meta.token) {
                        throw new MoleculerError("No token provided", 401, "NO_TOKEN");
                    }

                    const decoded = jwt.verify(ctx.meta.token, this.settings.JWT_SECRET);
                    const { userId } = decoded;

                    const orders = await ctx.call("orders.find", { query: { userId } });
                    return { message: "List of all orders", orders };
                } catch (error) {
                    throw new MoleculerError("Unable to fetch orders", 500, "FETCH_ERROR", { error });
                }
            },
        },
    },

    started() {
        console.log("Order service started");
    },
};