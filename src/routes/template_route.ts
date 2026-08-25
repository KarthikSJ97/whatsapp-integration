// src/routes/template.route.ts
import { Elysia, t } from 'elysia';
import { templateService } from '../services/whatsapp_service';

// Define explicit validation schema using TypeBox / Elysia t
const createTemplateSchema = t.Object({
    name: t.String(),
    category: t.Union([
        t.Literal('MARKETING'),
        t.Literal('UTILITY'),
        t.Literal('AUTHENTICATION'),
    ]),
    language: t.String({ default: 'en_US' }),
    components: t.Array(t.Any()),
});

const updateTemplateSchema = t.Object({
    components: t.Array(t.Any()),
});

export const templateRoutes = new Elysia({ prefix: '/api/templates' })
    // READ: List all templates
    .get('/', async () => {
        return await templateService.listTemplates();
    })

    // READ: Get template by name
    .get('/:name', async ({ params: { name } }) => {
        return await templateService.getTemplateByName(name);
    })

    // CREATE: Post new template (chained directly so Elysia infers body correctly)
    .post(
        '/',
        async ({ body }) => {
            // TypeScript now correctly infers 'body' properties instead of 'unknown'
            return await templateService.createTemplate(body);
        },
        {
            body: createTemplateSchema,
        }
    )

    // UPDATE: Edit template components
    .put(
        '/:id',
        async ({ params: { id }, body }) => {
            return await templateService.updateTemplate(id, body.components);
        },
        {
            body: updateTemplateSchema,
        }
    )

    // DELETE: Delete template by name
    .delete('/:name', async ({ params: { name } }) => {
        return await templateService.deleteTemplate(name);
    });