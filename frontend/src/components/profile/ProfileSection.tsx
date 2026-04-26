import { useContext, useEffect, useState } from 'react';

import { fmtProvider } from '@/lib/formatModel';

import { TreeContext } from '@/components/TreeProvider.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
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
import { useAuthContext } from '@/lib/authContext.tsx';
import {
  ChangePasswordSchema,
  UpdateNameSchema,
  changePasswordSchema,
  updateNameSchema,
} from '@/schemas/profile.ts';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  CheckSquare,
  Coins,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Mail,
  Settings,
  Square,
  Trash2,
  User,
} from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface BudgetLimit {
  id: string;
  model: { id: string; name: string; provider: string };
  dollarLimit: number | null;
  usedDollars: number;
  resetAt: string;
}

type ConversationConfirmAction = 'delete-all' | 'delete-not-favorite' | null;

export default function ProfileSection() {
  const { t } = useTranslation();
  const { user, isAdmin, updateUser, changePassword } = useAuthContext();
  const {
    chats,
    deleteNonFavoriteChats,
    deleteAllChats,
    isDeletingNonFavoriteChats,
    isDeletingAllChats,
  } = useContext(TreeContext);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConversationConfirmAction>(null);
  const [budgets, setBudgets] = useState<BudgetLimit[] | null>(null);
  const [tokenLimitsLoading, setTokenLimitsLoading] = useState(true);
  const [tokenLimitsError, setTokenLimitsError] = useState(false);

  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    setTokenLimitsLoading(true);
    setTokenLimitsError(false);
    fetch(`${baseUrl}/users/me/tokens`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: BudgetLimit[]) => setBudgets(data))
      .catch(() => {
        setBudgets(null);
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
    {
      id: 'min',
      label: t('profile.validation.passwordMin'),
      met: (newPassword?.length ?? 0) >= 8,
    },
    {
      id: 'capital',
      label: t('profile.validation.passwordCapital'),
      met: /[A-Z]/.test(newPassword ?? ''),
    },
    {
      id: 'number',
      label: t('profile.validation.passwordNumber'),
      met: /[0-9]/.test(newPassword ?? ''),
    },
    {
      id: 'special',
      label: t('profile.validation.passwordSpecial'),
      met: /[^A-Za-z0-9]/.test(newPassword ?? ''),
    },
  ];

  const onNameSubmit = nameForm.handleSubmit(async ({ name }) => {
    try {
      await updateUser(name);
      toast.success(t('profile.updateSuccess'));
    } catch {
      toast.error(t('profile.updateError'));
    }
  });

  const onPasswordSubmit = passwordForm.handleSubmit(
    async ({ currentPassword, newPassword }) => {
      try {
        await changePassword(currentPassword, newPassword);
        toast.success(t('profile.passwordSuccess'));
        passwordForm.reset();
      } catch {
        toast.error(t('profile.passwordError'));
      }
    },
  );

  const handleDeleteAllConversations = async () => {
    if (chats.length === 0 || isDeletingAllChats) {
      return;
    }

    setConfirmAction('delete-all');
  };

  const handleDeleteNotFavoriteConversations = async () => {
    const nonFavoriteCount = chats.filter((chat) => !chat.favourite).length;
    if (nonFavoriteCount === 0 || isDeletingNonFavoriteChats) {
      return;
    }

    setConfirmAction('delete-not-favorite');
  };

  const handleConfirmConversationAction = async () => {
    if (confirmAction === 'delete-all') {
      try {
        await deleteAllChats();
        toast.success(t('profile.deleteAllConversationsSuccess'));
        setConfirmAction(null);
      } catch {
        toast.error(t('profile.deleteAllConversationsError'));
      }
      return;
    }

    if (confirmAction === 'delete-not-favorite') {
      try {
        await deleteNonFavoriteChats();
        toast.success(t('profile.deleteNotFavoriteConversationsSuccess'));
        setConfirmAction(null);
      } catch {
        toast.error(t('profile.deleteNotFavoriteConversationsError'));
      }
    }
  };

  const isConfirmActionPending =
    confirmAction === 'delete-all'
      ? isDeletingAllChats
      : confirmAction === 'delete-not-favorite'
        ? isDeletingNonFavoriteChats
        : false;

  const confirmDescription =
    confirmAction === 'delete-all'
      ? t('profile.deleteAllConversationsConfirm')
      : t('profile.deleteNotFavoriteConversationsConfirm');

  const confirmButtonLabel =
    confirmAction === 'delete-all'
      ? t('profile.deleteAllConversations')
      : t('profile.deleteNotFavoriteConversations');

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
                    className="border-white/70 bg-transparent text-white hover:border-white hover:bg-white hover:text-slate-900">
                    {t('profile.saveChanges')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => nameForm.reset({ name: user?.name ?? '' })}>
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
                            aria-label={
                              showCurrent
                                ? t('profile.hideCurrentPassword')
                                : t('profile.showCurrentPassword')
                            }
                            aria-pressed={showCurrent}
                            className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2">
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
                            aria-label={
                              showNew
                                ? t('profile.hideNewPassword')
                                : t('profile.showNewPassword')
                            }
                            aria-pressed={showNew}
                            className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2">
                            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </FormControl>
                      <ul className="mt-2 space-y-1">
                        {passwordRules.map((rule) => (
                          <li
                            key={rule.id}
                            className={`flex items-center gap-2 text-xs transition-colors ${rule.met ? 'text-green-500' : 'text-muted-foreground'}`}>
                            {rule.met ? (
                              <CheckSquare size={14} className="shrink-0" />
                            ) : (
                              <Square size={14} className="shrink-0" />
                            )}
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
                            aria-label={
                              showConfirm
                                ? t('profile.hideConfirmPassword')
                                : t('profile.showConfirmPassword')
                            }
                            aria-pressed={showConfirm}
                            className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2">
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
                    className="border-white/70 bg-transparent text-white hover:border-white hover:bg-white hover:text-slate-900">
                    {t('profile.saveChanges')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => passwordForm.reset()}>
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
              <Coins size={20} />
              {t('profile.tokens.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tokenLimitsLoading ? null : tokenLimitsError ? (
              <p className="text-destructive text-sm">{t('profile.tokens.loadError')}</p>
            ) : budgets === null || budgets.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t('profile.tokens.allModels')}</p>
            ) : (
              <div className="space-y-4">
                {budgets.map((budget) => {
                  const hasLimit = budget.dollarLimit != null && budget.dollarLimit > 0;
                  const pct = hasLimit
                    ? Math.min(100, (budget.usedDollars / budget.dollarLimit!) * 100)
                    : 0;
                  const barColor =
                    pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-primary';
                  const fmtUsd = (v: number) =>
                    Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  return (
                    <div key={budget.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{fmtProvider(budget.model.provider)}</span>
                        <span className="text-muted-foreground text-xs">
                          {hasLimit ? `${pct.toFixed(1)} %` : '∞'}
                        </span>
                      </div>
                      {hasLimit && (
                        <div className="bg-muted h-2 overflow-hidden rounded-full">
                          <div
                            className={`h-full rounded-full transition-all ${barColor}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                      <div className="text-muted-foreground flex items-center justify-between text-xs">
                        <span>
                          {hasLimit
                            ? t('profile.tokens.used', {
                                used: fmtUsd(budget.usedDollars),
                                total: fmtUsd(budget.dollarLimit!),
                              })
                            : t('profile.tokens.usedUnlimited', {
                                used: fmtUsd(budget.usedDollars),
                              })}
                        </span>
                        <span>
                          {t('profile.tokens.reset')}{' '}
                          {new Date(budget.resetAt).toLocaleDateString(undefined, {
                            timeZone: 'UTC',
                          })}
                        </span>
                      </div>
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
              <Button
                asChild
                variant="outline"
                className="border-white/70 bg-transparent text-white hover:border-white hover:bg-white hover:text-slate-900">
                <Link to="/admin">{t('admin.goToAdmin')}</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-6">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <Globe size={20} />
                {t('profile.language')}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 items-center">
              <div className="flex w-full flex-col gap-2">
                <Button
                  variant="outline"
                  className={
                    currentLang === 'cs'
                      ? 'border-primary bg-primary text-primary-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground'
                      : undefined
                  }
                  onClick={() => i18n.changeLanguage('cs')}>
                  Čeština
                </Button>
                <Button
                  variant="outline"
                  className={
                    currentLang === 'en'
                      ? 'border-primary bg-primary text-primary-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground'
                      : undefined
                  }
                  onClick={() => i18n.changeLanguage('en')}>
                  English
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <Trash2 size={20} />
                {t('profile.conversationActions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    chats.every((chat) => chat.favourite) ||
                    isDeletingNonFavoriteChats ||
                    isDeletingAllChats
                  }
                  onClick={handleDeleteNotFavoriteConversations}
                  className="border-orange-500/50 text-orange-500 hover:border-orange-500 hover:bg-orange-500/10 hover:text-orange-500">
                  <Trash2 size={14} />
                  {t('profile.deleteNotFavoriteConversations')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    chats.length === 0 || isDeletingAllChats || isDeletingNonFavoriteChats
                  }
                  onClick={handleDeleteAllConversations}
                  className="border-destructive/50 text-destructive hover:border-destructive hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 size={14} />
                  {t('profile.deleteAllConversations')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open && !isConfirmActionPending) {
            setConfirmAction(null);
          }
        }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">{t('profile.conversationActionsConfirmTitle')}</DialogTitle>
            <DialogDescription>{confirmDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmAction(null)}
              disabled={isConfirmActionPending}>
              {t('profile.cancel')}
            </Button>
            <Button
              variant="outline"
              onClick={handleConfirmConversationAction}
              disabled={isConfirmActionPending}
              className="border-destructive/50 text-destructive hover:border-destructive hover:bg-destructive hover:text-destructive-foreground">
              {confirmButtonLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
