const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize.js');
const DbService = require("moleculer-db");
const SequelizeAdapter = require("moleculer-db-adapter-sequelize");

module.exports = {
  name: "users",
  mixins: [DbService],
  adapter: new SequelizeAdapter(sequelize),
  model: {
    name: "db.user",
    define: {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true, 
        autoIncrement: true
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING, 
        allowNull: false,
        unique: true
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      userType: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "user",
      },
    },
    options: {
      timestamps: false ,
      tableName:'users'
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
    this.logger.info('db.user service started');
    await this.syncModels();
  }
};
