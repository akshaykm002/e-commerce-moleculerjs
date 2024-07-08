const { DataTypes } = require("sequelize");
const sequelize = require("./sequelize.js");
const DbService = require("moleculer-db");
const SequelizeAdapter = require("moleculer-db-adapter-sequelize");
const { v4: uuidv4 } = require("uuid");
const generateCartId = () => `c_${uuidv4()}`;


module.exports = {
	name: "cart",
	mixins: [DbService],
	adapter: new SequelizeAdapter(sequelize),
	model: {
		name: "cart",
		define: {
			id: {
				type: DataTypes.STRING,
				defaultValue: generateCartId,
				primaryKey: true,
			},
			userId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			productId: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			quantity: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
		},
		options: {
			timestamps: false,
			tableName: "cart",
		},
	},
	methods: {
		async syncModels() {
			try {
				await this.adapter.db.sync({ alter: true });
				this.logger.info("Database models synced successfully.");
			} catch (error) {
				this.logger.error("Error syncing database models:", error);
			}
		},
	},
	async started() {
		this.logger.info("Cart service started");
		await this.syncModels();
	},
};
