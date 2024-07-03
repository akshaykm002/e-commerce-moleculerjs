const DbService = require('moleculer-db');
const { MoleculerError } = require("moleculer").Errors;
require('dotenv').config();



module.exports = {
  name: 'product',

  mixins: [DbService],

  settings: {
  },

  actions: {
   

 
  }
  ,

  started() {
    console.log('Product service started');
  },
};
