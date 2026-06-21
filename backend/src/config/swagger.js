const swaggerJsdoc = require('swagger-jsdoc');
module.exports = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: { title: 'CRM SaaS API', version: '1.0.0', description: 'REST API for CRM Platform' },
    servers: [{ url: `http://localhost:${process.env.PORT || 5000}${process.env.API_PREFIX || '/api/v1'}` }],
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.js'],
});