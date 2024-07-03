const jwt = require('jsonwebtoken');
const { MoleculerError } = require("moleculer").Errors;
require('dotenv').config();

const authenticateToken = {
  localAction: {
    async handler(ctx, req) {
      console.log("req",req);
      const authHeader = ctx.meta.headers && ctx.meta.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        throw new MoleculerError('Unauthorized', 401);
      }

      try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        ctx.meta.user = decodedToken.userId;

        console.log('Decoded Token:', decodedToken);

        return next();
      } catch (error) {
        console.error('Error authenticating user:', error);
        throw new MoleculerError('Unauthorized', 401);
      }
    }
  }
};

module.exports = authenticateToken;
