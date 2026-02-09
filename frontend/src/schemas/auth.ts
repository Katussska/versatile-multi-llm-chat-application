import { TFunction } from 'i18next';
import { z } from 'zod';

export const loginSchema = (t: TFunction<'translation', undefined>) =>
  z.object({
    email: z.string().email({ message: t('auth.validation.email') }),
    password: z
      .string()
      .min(6, { message: t('auth.validation.passwordMin') })
      .max(20, { message: t('auth.validation.passwordMax') })
      .regex(/[A-Z]/, { message: t('auth.validation.passwordCapital') })
      .regex(/[0-9]/, { message: t('auth.validation.passwordNumber') }),
  });

export const resetPasswordSchema = (t: TFunction<'translation', undefined>) =>
  z.object({
    email: z.string().email({ message: t('auth.validation.email') }),
  });

export type LoginSchema = z.output<ReturnType<typeof loginSchema>>;
export type ResetPasswordSchema = z.output<ReturnType<typeof resetPasswordSchema>>;
