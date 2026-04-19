import { TFunction } from 'i18next';
import { z } from 'zod';

export const updateNameSchema = (t: TFunction<'translation', undefined>) =>
  z.object({
    name: z.string().min(1, { message: t('profile.validation.nameRequired') }),
  });

export const changePasswordSchema = (t: TFunction<'translation', undefined>) =>
  z
    .object({
      currentPassword: z
        .string()
        .min(1, { message: t('profile.validation.currentPasswordRequired') }),
      newPassword: z
        .string()
        .min(8, { message: t('profile.validation.passwordMin') })
        .max(64, { message: t('profile.validation.passwordMax') })
        .regex(/[A-Z]/, { message: t('profile.validation.passwordCapital') })
        .regex(/[0-9]/, { message: t('profile.validation.passwordNumber') })
        .regex(/[^A-Za-z0-9]/, { message: t('profile.validation.passwordSpecial') }),
      confirmPassword: z
        .string()
        .min(1, { message: t('profile.validation.confirmPasswordRequired') }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('profile.validation.passwordMismatch'),
      path: ['confirmPassword'],
    })
    .refine((data) => data.newPassword !== data.currentPassword, {
      message: t('profile.validation.passwordSameAsCurrent'),
      path: ['newPassword'],
    });

export type UpdateNameSchema = z.output<ReturnType<typeof updateNameSchema>>;
export type ChangePasswordSchema = z.output<ReturnType<typeof changePasswordSchema>>;
