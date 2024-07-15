const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const DbService = require("moleculer-db");
const { MoleculerError } = require("moleculer").Errors;
require("dotenv").config();

module.exports = {
	name: "user",

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
		register: {
			params: {
				username: { type: "string", min: 3 },
				email: { type: "email" },
				password: { type: "string", min: 6 },
				userType: { type: "string", optional: true }
			},
			async handler(ctx) {
				try {
					const { username, email, password, userType} = ctx.params; 
					// Check if the email already exists
					const existingEmail = await ctx.call("users.find", {
						query: { email },
					});
					if (existingEmail.length > 0) {
						throw new MoleculerError("Email already exists", 400);
					}
				
					// Hash the password
					const hashedPassword = await bcrypt.hash(password, 10);
					// Create the new user
					const userRole = userType || 'user';
					await ctx.call("users.create", {
						username,
						email,
						password: hashedPassword,
						userType:userRole
					});
					// Fetch user data without password
					const userDataWithoutPassword = await ctx.call(
						"users.find",
						{ query: { email }, fields: ["username", "email" ,"userType"] }
					);
					return {
						message: "User registered successfully",
						user: userDataWithoutPassword[0],
					};
				} catch (error) {
					// Handle and log errors
					console.error("Error during user registration:", error);
					if (error instanceof MoleculerError) {
						throw error;
					}
					throw new MoleculerError(
						"Registration failed",
						500,
						"REGISTRATION_FAILED",
						{ error }
					);
				}
			},
		},
		login: {
			params: {
				email: { type: "email" }, 
				password: { type: "string", min: 6 }, 
			},
			async handler(ctx) {
				try {
					const { email, password } = ctx.params;

					// Find users by email
					const users = await ctx.call("users.find", {
						query: { email },
					});

					// Check if a user with the provided email exists
					const validUser = users[0];
					if (!validUser) {
						throw new MoleculerError("User not found", 404);
					}

					// Compare the provided password with the stored hashed password
					const validPassword = await bcrypt.compare(
						password,
						validUser.password
					);
					if (!validPassword) {
						throw new MoleculerError("Invalid credentials", 401);
					}

					// Generate a JWT token using the user's id and useRole as the payload
					const token = jwt.sign(
						{ userId: validUser.id ,userRole: validUser.userType},
						this.settings.JWT_SECRET,
						// { expiresIn: tokenExpiryTime }
					);

					
					return { message: "User logged in successfully", token };
				} catch (error) {
					// Check if the error is an instance of MoleculerError
					if (error instanceof MoleculerError) {
						throw error;
					}

					console.error("Error during login:", error);
					
					throw new MoleculerError(
						"Login failed",
						500,
						"LOGIN_FAILED",
						{ error }
					);
				}
			},
		},

		getUserByToken: {
			async handler(ctx) {
				const token = ctx.meta.token;
				if (!token) {
					throw new MoleculerError("Token is required", 400);
				}

				try {
					const decodedToken = jwt.verify(
						token,
						this.settings.JWT_SECRET
					);
					console.log("decoded token", decodedToken);

					// Verify if the token payload has the required information
					if (!decodedToken.userId) {
						throw new MoleculerError("Invalid token payload", 401);
					}

					const users = await ctx.call("users.find", {
						query: { id: decodedToken.userId },
						fields: ["id", "username", "email","userType"],
					});

					if (users.length === 0) {
						throw new MoleculerError("User not found", 404);
					}
					//return the authenticated user as response
					return { message: "Authenticated User", User: users[0] };
				} catch (error) {
					if (error.name === "JsonWebTokenError") {
						throw new MoleculerError(
							"Invalid token",
							401,
							"INVALID_TOKEN",
							{ error }
						);
					} else {
						throw new MoleculerError(
							"Error authenticating user",
							500,
							"AUTH_ERROR",
							{ error }
						);
					}
				}
			},
		},

		logout: {
			async handler(ctx) {
				return { message: "Logged out successfully" };
			},
		},
	},
	started() {
		console.log("User service started");
	},
};
