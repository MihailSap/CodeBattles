import { z } from 'zod';
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'E-mail не может быть пустым')
  .max(255, 'E-mail должен быть не длиннее 255 символов')
  .email('Некорректный E-mail');
export const loginSchema = z
  .string()
  .trim()
  .min(1, 'Логин не может быть пустым')
  .min(3, 'Логин - от 3 до 50 символов')
  .max(50, 'Логин - от 3 до 50 символов');
export const passwordSchema = z
  .string()
  .min(8, 'Минимальная длина пароля - 8 символов')
  .max(50, 'Пароль должен быть не длиннее 50 символов');
export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Введите пароль'),
});
export const registerFormSchema = z
  .object({
    login: loginSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Повторите пароль'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });
export const recoveryFormSchema = z.object({
  email: emailSchema,
});

const passwordPairSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Повторите пароль'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

export const resetPasswordFormSchema = passwordPairSchema;
export const profilePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Введите текущий пароль').max(50, 'Пароль должен быть не длиннее 50 символов'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Повторите пароль'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });
