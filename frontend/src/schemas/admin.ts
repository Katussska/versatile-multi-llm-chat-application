import { TFunction } from 'i18next';
import { z } from 'zod';

const passwordField = (t: TFunction<'translation', undefined>) =>
  z
    .string()
    .min(8, { message: t('profile.validation.passwordMin') })
    .max(64, { message: t('profile.validation.passwordMax') })
    .regex(/[A-Z]/, { message: t('profile.validation.passwordCapital') })
    .regex(/[0-9]/, { message: t('profile.validation.passwordNumber') })
    .regex(/[^A-Za-z0-9]/, { message: t('profile.validation.passwordSpecial') });

export const createUserSchema = (t: TFunction<'translation', undefined>) =>
  z.object({
    email: z.string().email({ message: t('auth.validation.email') }),
    password: passwordField(t),
    role: z.enum(['USER', 'ADMIN']),
  });

export const updateUserSchema = (t: TFunction<'translation', undefined>) =>
  z.object({
    email: z
      .string()
      .email({ message: t('auth.validation.email') })
      .optional()
      .or(z.literal('')),
    password: passwordField(t).optional().or(z.literal('')),
    role: z.enum(['USER', 'ADMIN']).optional(),
  });

export type CreateUserSchema = z.output<ReturnType<typeof createUserSchema>>;
export type UpdateUserSchema = z.output<ReturnType<typeof updateUserSchema>>;
