import { useEffect, useState } from 'react';

import { Auth } from '@/components/auth.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input.tsx';
import { useAuthContext } from '@/lib/authContext.tsx';
import { LoginSchema, loginSchema } from '@/schemas/auth.ts';
import { supabase } from '@/supabase.ts';
import { zodResolver } from '@hookform/resolvers/zod';

import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

export default function _authLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  // todo: loading use loading state on button or somethign
  const [, setLoading] = useState(false);

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema(t)),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = form.handleSubmit(async ({ email, password }) => {
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error(error);
      form.setError('root', {
        type: 'custom',
        message: error.message,
      });
    }
    setLoading(false);
    navigate('/');
  });

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [navigate, user]);

  return (
    <div className='w-screen h-screen flex justify-center items-center'>
    <div className='w-1/3 h-fit'>
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
        <Button type="submit" className='w-full flex mt-5 mx-auto'>{t('auth.login.submit')}</Button>
      </Form>
    </Auth>
    </div>
    </div>
  );
}
