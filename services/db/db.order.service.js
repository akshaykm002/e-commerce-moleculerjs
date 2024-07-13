const { DataTypes } = require("sequelize");
const sequelize = require("./sequelize.js");
const DbService = require("moleculer-db");
const SequelizeAdapter = require("moleculer-db-adapter-sequelize");
const { v4: uuidv4 } = require("uuid");

const generateOrderId = () => `o_${uuidv4()}`;

module.exports = {
	name: "orders",
	mixins: [DbService],
	adapter: new SequelizeAdapter(sequelize),
	model: {
		name: "db.order",
		define: {
			id: {
				type: DataTypes.STRING,
				defaultValue: generateOrderId,
				primaryKey: true,
			},
            userId: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            totalPrice: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            status: {
                type: DataTypes.ENUM,
                values: ['pending', 'completed', 'cancelled'],
                allowNull: false,
                defaultValue: 'pending',
            },
            paymentIntentId: {
                type: DataTypes.STRING, 
                allowNull: true, 
            },
		},
		options: {
			timestamps: true,
			tableName: "orders",
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
		this.logger.info("db.order service started");
		await this.syncModels();
	},
};
