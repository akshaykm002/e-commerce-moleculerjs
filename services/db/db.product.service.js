const { DataTypes } = require("sequelize");
const sequelize = require("./sequelize.js");
const DbService = require("moleculer-db");
const SequelizeAdapter = require("moleculer-db-adapter-sequelize");
const { v4: uuidv4 } = require("uuid");

const generateProductId = () => `p_${uuidv4()}`;

module.exports = {
	name: "products",
	mixins: [DbService],
	adapter: new SequelizeAdapter(sequelize),
	model: {
		name: "db.product",
		define: {
			id: {
				type: DataTypes.STRING,
				defaultValue: generateProductId,
				primaryKey: true,
			},
			name: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			description: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			price: {
				type: DataTypes.FLOAT,
				allowNull: false,
			},
			imageUrl: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			stock: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
		},
		options: {
			timestamps: false,
			tableName: "products",
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
		this.logger.info("db.product service started");
		await this.syncModels();
	},
};
