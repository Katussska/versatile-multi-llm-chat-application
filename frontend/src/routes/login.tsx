import { useEffect } from 'react';

import { Auth } from '@/components/auth.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input.tsx';
import { useAuthContext } from '@/lib/authContext.tsx';
import { LoginSchema, loginSchema } from '@/schemas/auth.ts';
import { zodResolver } from '@hookform/resolvers/zod';

import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

export default function _authLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, isPending, logIn, loginError } = useAuthContext();

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema(t)),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = form.handleSubmit(async ({ email, password }) => {
    try {
      await logIn({ email, password, rememberMe: true });
      navigate('/');
    } catch (error) {
      form.setError('root', {
        type: 'custom',
        message: error instanceof Error ? error.message : 'Unable to sign in right now.',
      });
    }
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="h-fit w-1/3">
        <Auth
          title={t('auth.login.title')}
          footer={
            <p>
              <Link to="resetPassword">{t('auth.login.forgotPassword')}</Link>
            </p>
          }>
          <Form {...form} onSubmit={onSubmit}>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.login.email')}</FormLabel>
                  <FormControl>
                    <Input placeholder="example@gmail.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.login.password')}</FormLabel>
                  <FormControl>
                    <Input placeholder="******" type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="mx-auto mt-5 flex w-full">
              {isPending ? 'Signing in...' : t('auth.login.submit')}
            </Button>
            {(form.formState.errors.root?.message || loginError) && (
              <p className="text-destructive mt-3 text-sm font-medium">
                {form.formState.errors.root?.message ?? loginError}
              </p>
            )}
          </Form>
        </Auth>
      </div>
    </div>
  );
}
