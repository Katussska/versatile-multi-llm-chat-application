import { useAuthContext } from '@/lib/authContext.tsx';
import { ChangePasswordSchema, UpdateNameSchema, changePasswordSchema, updateNameSchema } from '@/schemas/profile.ts';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckSquare, Coins, Eye, EyeOff, Globe, Lock, Mail, Settings, Square, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
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

interface TokenLimit {
  id: string;
  model: { id: string; name: string; provider: string };
  tokenCount: number;
  usedTokens: number;
  resetAt: string;
}

export default function ProfileSection() {
  const { t } = useTranslation();
  const { user, isAdmin, updateUser, changePassword } = useAuthContext();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [tokens, setTokens] = useState<TokenLimit[] | null>(null);
  const [tokenLimitsLoading, setTokenLimitsLoading] = useState(true);
  const [tokenLimitsError, setTokenLimitsError] = useState(false);

  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    setTokenLimitsLoading(true);
    setTokenLimitsError(false);
    fetch(`${baseUrl}/users/me/tokens`, { credentials: 'include' })
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data: TokenLimit[]) => setTokens(data))
      .catch(() => {
        setTokens(null);
        setTokenLimitsError(true);
      })
      .finally(() => setTokenLimitsLoading(false));
  }, [baseUrl]);

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
    { id: 'min', label: t('profile.validation.passwordMin'), met: (newPassword?.length ?? 0) >= 8 },
    { id: 'capital', label: t('profile.validation.passwordCapital'), met: /[A-Z]/.test(newPassword ?? '') },
    { id: 'number', label: t('profile.validation.passwordNumber'), met: /[0-9]/.test(newPassword ?? '') },
    { id: 'special', label: t('profile.validation.passwordSpecial'), met: /[^A-Za-z0-9]/.test(newPassword ?? '') },
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
                            aria-label={showCurrent ? t('profile.hideCurrentPassword') : t('profile.showCurrentPassword')}
                            aria-pressed={showCurrent}
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
                            aria-label={showNew ? t('profile.hideNewPassword') : t('profile.showNewPassword')}
                            aria-pressed={showNew}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </FormControl>
                      <ul className="mt-2 space-y-1">
                        {passwordRules.map((rule) => (
                          <li
                            key={rule.id}
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
                            aria-label={showConfirm ? t('profile.hideConfirmPassword') : t('profile.showConfirmPassword')}
                            aria-pressed={showConfirm}
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins size={20} />
              {t('profile.tokens.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tokenLimitsLoading ? null : tokenLimitsError ? (
              <p className="text-sm text-destructive">{t('profile.tokens.loadError')}</p>
            ) : tokens === null || tokens.length === 0 ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('profile.tokens.allModels')}</span>
                <span className="text-lg font-medium">∞</span>
              </div>
            ) : (
              <div className="space-y-4">
                {tokens.map((token) => {
                  const pct = Math.min(100, (token.usedTokens / token.tokenCount) * 100);
                  const barColor = pct >= 90
                    ? 'bg-red-500'
                    : pct >= 70
                      ? 'bg-yellow-500'
                      : 'bg-primary';
                  return (
                    <div key={token.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{token.model.name}</span>
                        <span className="text-muted-foreground text-xs">{pct.toFixed(1)} %</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${barColor}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('profile.tokens.reset')} {new Date(token.resetAt).toLocaleDateString(undefined, { timeZone: 'UTC' })}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings size={20} />
                {t('admin.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="border-white/70 bg-transparent text-white hover:border-white hover:bg-white hover:text-slate-900">
                <Link to="/admin">{t('admin.goToAdmin')}</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
