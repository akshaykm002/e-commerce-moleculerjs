const DbService = require("moleculer-db");
const { MoleculerError } = require("moleculer").Errors;
const jwt = require("jsonwebtoken");

module.exports = {
    name: "cart",

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
        getCart: {
            async handler(ctx) {
                try {
                    if (!ctx.meta.token) {
                        throw new MoleculerError("No token provided", 401, "NO_TOKEN");
                    }

                    const decoded = jwt.verify(ctx.meta.token, this.settings.JWT_SECRET);
                    const { userId } = decoded;

                    const cartItems = await ctx.call("cart.find", { query: { userId } });
                    return { message: "User's cart", cartItems };
                } catch (error) {
                    throw new MoleculerError("Unable to fetch cart", 500, "FETCH_ERROR", { error });
                }
            },
        },
        addToCart: {
            params: {
                productId: { type: "string" ,optional:"false" },
                quantity: { type: "number", optional:"true",default:1 }
            },
            async handler(ctx) {
                try {
                    if (!ctx.meta.token) {
                        throw new MoleculerError("No token provided", 401, "NO_TOKEN");
                    }

                    const decoded = jwt.verify(ctx.meta.token, this.settings.JWT_SECRET);
                    const { userId } = decoded;

                    const { productId, quantity } = ctx.params;

                     // Check if the product exists
                     const product = await ctx.call("products.get", { id: productId });
                     if (!product) {
                         throw new MoleculerError("Invalid product ID", 400, "INVALID_PRODUCT");
                     }

                    const cartItem = await ctx.call("cart.create", { userId, productId, quantity });
                    return { message: "Item added to cart", cartItem };
                } catch (error) {
                    throw new MoleculerError("Unable to add item to cart", 500, "CREATE_ERROR", { error });
                }
            },
        },
      
    },
    started() {
        console.log("Cart service started");
    },
};
