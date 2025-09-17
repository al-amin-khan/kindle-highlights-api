const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.1",
        info: {
            title: "Kindle Highlights API",
            version: "1.0.0",
            description:
                "Public daily highlights + admin/search endpoints for Kindle My Clippings.",
        },
        servers: [{ url: "/api/v1" }],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
            schemas: {
                Highlight: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        bookTitle: { type: "string" },
                        author: { type: "string" },
                        content: { type: "string" },
                        location: { type: "string", nullable: true },
                        page: { type: "string", nullable: true },
                        dateAdded: {
                            type: "string",
                            format: "date-time",
                            nullable: true,
                        },
                        lang: { type: "string", enum: ["en", "bn"] },
                        lastServedAt: {
                            type: "string",
                            format: "date-time",
                            nullable: true,
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                            nullable: true,
                        },
                    },
                },
                DailyPublicResponse: {
                    type: "object",
                    properties: {
                        windowKey: { type: "string" },
                        date: { type: "string" },
                        timezone: { type: "string" },
                        count: { type: "integer" },
                        highlights: {
                            type: "array",
                            items: { $ref: "#/components/schemas/Highlight" },
                        },
                    },
                },
            },
        },
    },
    apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = { swaggerUi, swaggerSpec };
