import type { NodePlopAPI } from 'plop';

export default function (plop: NodePlopAPI) {
    plop.setHelper('current-date', () => new Date().toISOString());
    plop.setHelper('current-year', () => new Date().getFullYear());
    plop.setHelper('includes', (array, value) => array.includes(value));
    plop.setGenerator('post', {
        description: 'Create a new blog post',
        prompts: [
            {
                type: 'input',
                name: 'title',
                message: 'Enter post title:',
                validate: input => input ? true : 'This field is required'
            },
            {
                type: 'input',
                name: 'slug',
                message: 'Enter slug (file path):',
                default: (answers: { title: string }) => answers.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
            },
            {
                type: 'input',
                name: 'description',
                message: 'Enter a short description:'
            },
            {
                type: 'input',
                name: 'tags',
                message: 'Enter tags (comma-separated):',
                validate: input => String(input).trim() ? true : 'This field is required',
                filter: input =>
                String(input)
                .split(',')
                .map(t => t.trim())
            },
            {
                type: 'checkbox',
                name: 'flags',
                message: 'Any special visibility requirements?',
                choices: [
                    { name: 'Featured', value: 'featured' },
                    { name: 'Draft', value: 'draft' }
                ]
            },
        ],
        actions: [
            {
                type: 'add',
                path: 'src/data/blog/_{{current-year}}/{{slug}}.mdx',
                templateFile: 'plop-templates/post.hbs'
            }
        ]
    });
}

