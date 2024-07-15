const DbService = require("moleculer-db");
const { MoleculerError } = require("moleculer").Errors;
const jwt = require("jsonwebtoken");
const stripe = require("../../config/stripe.js")
const nodemailer = require("nodemailer")

module.exports = {
    name: "order",

    mixins: [DbService],

    settings: {
        JWT_SECRET: process.env.ACCESS_TOKEN_SECRET,
        email: {
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false, 
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS, 
            },
        },
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

                    // Payment processing with Stripe
                    const paymentIntent = await stripe.paymentIntents.create({
                        amount: Math.round(totalPrice * 100), 
                        currency: 'inr', 
                        description: 'E-commerce purchase',
                        payment_method_types: ['card']
                    });
                    
                     // Create the order in your database
                     const order = await ctx.call("orders.create", {
                        userId,
                        totalPrice,
                        status: 'pending',
                        paymentIntentId: paymentIntent.id,
                    });
                    console.log("Order created", order);

                    const orderId = order.id
                    const status = order.status
                    //Use the current order status and send it to the user with email

                    const user = await ctx.call("users.get", { id: userId });
                    if (user && user.email) {
                        await this.sendEmailNotification(user.email, orderId, status);
                    }

                    // Clear user's cart after placing the order
                    for (const item of cartItems.cartItems) {
                        await ctx.call("cart.removeCartItem", { id: item.id });
                    }

                    return { message: "Order placed successfully", order, paymentIntent };
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
     methods: {
        //Nodemailer for sending email notifications
        async sendEmailNotification(email, orderId, status) {
            let transporter = nodemailer.createTransport(this.settings.email);

            await transporter.sendMail({
                from: '"E-commerce Platform" <no-reply@ecommerce.com>', 
                to: email, 
                subject: "Order Status Update", 
                text: `Your order with ID ${orderId} is now ${status}.`, 
                html: `<b>Your order with ID ${orderId} is now ${status}.</b>`, 
            });
        },
    },

    started() {
        console.log("Order service started");
    },
};
