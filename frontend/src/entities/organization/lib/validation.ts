import { z } from 'zod';

const URL_PATTERN = /^(https?:\/\/)[^\s/$.?#].[^\s]*$/i;

const optionalUrlSchema = z
  .string()
  .trim()
  .max(500, 'Ссылка должна быть не длиннее 500 символов')
  .refine((value) => !value || URL_PATTERN.test(value), 'Введите корректную ссылку');

export const organizationCreateFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Название организации не может быть пустым')
    .max(100, 'Название организации должно быть короче 100 символов'),
  link: optionalUrlSchema,
  description: z.string().max(3000, 'Описание должно быть не длиннее 3000 символов').default(''),
  logoFile: z
    .instanceof(File)
    .nullable()
    .refine((file): file is File => file !== null, {
      message: 'Загрузите логотип',
    }),
});
export const organizationSettingsFormSchema = z.object({
  name: organizationCreateFormSchema.shape.name,
  link: optionalUrlSchema,
  description: organizationCreateFormSchema.shape.description,
  logoFile: z.instanceof(File).nullable().default(null),
  logoUrl: z.string().default(''),
});

export type OrganizationCreateFormValues = z.infer<typeof organizationCreateFormSchema>;
export type OrganizationCreateFormInput = z.input<typeof organizationCreateFormSchema>;
export type OrganizationSettingsFormValues = z.infer<typeof organizationSettingsFormSchema>;
export type OrganizationSettingsFormInput = z.input<typeof organizationSettingsFormSchema>;
