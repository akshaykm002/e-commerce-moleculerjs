const { DataTypes } = require("sequelize");
const sequelize = require("./sequelize.js");
const DbService = require("moleculer-db");
const SequelizeAdapter = require("moleculer-db-adapter-sequelize");

module.exports = {
	name: "products",
	mixins: [DbService],
	adapter: new SequelizeAdapter(sequelize),
	model: {
		name: "db.product",
		define: {
            id:{
                type:DataTypes.INTEGER,
                primaryKey:true
            },
            name:{
                type:DataTypes.STRING,
                allownull:false
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
                //  
              },
              stock: {
                type: DataTypes.INTEGER,
                allowNull: false,
              },
        },
        options: {
            timestamps: false ,
            tableName:'products'
          }
	},
     methods: {
    async syncModels() {
      try {
        await this.adapter.db.sync({ alter: true });
        this.logger.info("Database models synced successfully.");
      } catch (error) {
        this.logger.error("Error syncing database models:", error);
      }
    }
  },

  async started() {
    this.logger.info('db.product service started');
    await this.syncModels();
  }
};
