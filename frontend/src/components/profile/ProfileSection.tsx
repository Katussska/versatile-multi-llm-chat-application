import { useAuthContext } from '@/lib/authContext.tsx';
import { ChangePasswordSchema, UpdateNameSchema, changePasswordSchema, updateNameSchema } from '@/schemas/profile.ts';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckSquare, Eye, EyeOff, Globe, Lock, Mail, Square, User } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input.tsx';
import i18n from '@/i18n.ts';

export default function ProfileSection() {
  const { t } = useTranslation();
  const { user, updateUser, changePassword } = useAuthContext();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const nameForm = useForm<UpdateNameSchema>({
    resolver: zodResolver(updateNameSchema(t)),
    defaultValues: { name: user?.name ?? '' },
  });

  const passwordForm = useForm<ChangePasswordSchema>({
    resolver: zodResolver(changePasswordSchema(t)),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const newPassword = useWatch({ control: passwordForm.control, name: 'newPassword' });
  const passwordRules = [
    { label: t('profile.validation.passwordMin'), met: (newPassword?.length ?? 0) >= 8 },
    { label: t('profile.validation.passwordCapital'), met: /[A-Z]/.test(newPassword ?? '') },
    { label: t('profile.validation.passwordNumber'), met: /[0-9]/.test(newPassword ?? '') },
    { label: t('profile.validation.passwordSpecial'), met: /[^A-Za-z0-9]/.test(newPassword ?? '') },
  ];

  const onNameSubmit = nameForm.handleSubmit(async ({ name }) => {
    try {
      await updateUser(name);
      toast.success(t('profile.updateSuccess'));
    } catch {
      toast.error(t('profile.updateError'));
    }
  });

  const onPasswordSubmit = passwordForm.handleSubmit(async ({ currentPassword, newPassword }) => {
    try {
      await changePassword(currentPassword, newPassword);
      toast.success(t('profile.passwordSuccess'));
      passwordForm.reset();
    } catch {
      toast.error(t('profile.passwordError'));
    }
  });

  const currentLang = i18n.language?.startsWith('cs') ? 'cs' : 'en';

  return (
    <div className="flex flex-1 flex-col items-center overflow-y-auto p-8 pt-20">
      <div className="w-full max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={20} />
              {t('profile.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...nameForm} onSubmit={onNameSubmit}>
              <div className="space-y-4">
                <FormField
                  control={nameForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('profile.name')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Mail size={14} />
                    {t('profile.email')}
                  </FormLabel>
                  <Input value={user?.email ?? ''} disabled />
                </FormItem>
                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={nameForm.formState.isSubmitting}
                    className="border-white/70 bg-transparent text-white hover:border-white hover:bg-white hover:text-slate-900"
                  >
                    {t('profile.saveChanges')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => nameForm.reset({ name: user?.name ?? '' })}
                  >
                    {t('profile.cancel')}
                  </Button>
                </div>
              </div>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock size={20} />
              {t('profile.password')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm} onSubmit={onPasswordSubmit}>
              <div className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('profile.currentPassword')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showCurrent ? 'text' : 'password'} {...field} />
                          <button
                            type="button"
                            onClick={() => setShowCurrent((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('profile.newPassword')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showNew ? 'text' : 'password'} {...field} />
                          <button
                            type="button"
                            onClick={() => setShowNew((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </FormControl>
                      <ul className="mt-2 space-y-1">
                        {passwordRules.map((rule) => (
                          <li
                            key={rule.label}
                            className={`flex items-center gap-2 text-xs transition-colors ${rule.met ? 'text-green-500' : 'text-muted-foreground'}`}
                          >
                            {rule.met
                              ? <CheckSquare size={14} className="shrink-0" />
                              : <Square size={14} className="shrink-0" />}
                            {rule.label}
                          </li>
                        ))}
                      </ul>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('profile.repeatPassword')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showConfirm ? 'text' : 'password'} {...field} />
                          <button
                            type="button"
                            onClick={() => setShowConfirm((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={passwordForm.formState.isSubmitting}
                    className="border-white/70 bg-transparent text-white hover:border-white hover:bg-white hover:text-slate-900"
                  >
                    {t('profile.saveChanges')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => passwordForm.reset()}
                  >
                    {t('profile.cancel')}
                  </Button>
                </div>
              </div>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe size={20} />
              {t('profile.language')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant={currentLang === 'cs' ? 'default' : 'outline'}
                onClick={() => i18n.changeLanguage('cs')}
              >
                CZ
              </Button>
              <Button
                variant={currentLang === 'en' ? 'default' : 'outline'}
                onClick={() => i18n.changeLanguage('en')}
              >
                EN
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
