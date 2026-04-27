import { useState } from 'react';

import { Button } from '@/components/ui/button.tsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Label } from '@/components/ui/label.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { getApiBaseUrl } from '@/lib/api-url.ts';
import { fmtProvider } from '@/lib/formatModel';
import { generatePassword } from '@/lib/utils.ts';
import { CreateUserSchema, createUserSchema } from '@/schemas/admin.ts';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  CheckSquare,
  Coins,
  Eye,
  EyeOff,
  Plus,
  RefreshCw,
  Square,
  UserPlus,
} from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface ModelOption {
  id: string;
  name: string;
  provider: string;
}

interface BudgetLimit {
  id: string;
  model: ModelOption;
  dollarLimit: number | null;
  usedDollars: number;
  resetAt: string;
}

interface CreateUserDialogProps {
  onCreated?: () => void;
}

export default function CreateUserDialog({ onCreated }: CreateUserDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmAdminOpen, setConfirmAdminOpen] = useState(false);

  const [step, setStep] = useState<'form' | 'tokens'>('form');
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [addedBudgets, setAddedBudgets] = useState<BudgetLimit[]>([]);
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [tokenProvider, setTokenProvider] = useState('');
  const [dollarLimit, setDollarLimit] = useState('');
  const [submittingToken, setSubmittingToken] = useState(false);

  const baseUrl = getApiBaseUrl();

  const form = useForm<CreateUserSchema>({
    resolver: zodResolver(createUserSchema(t)),
    defaultValues: { email: '', password: '', role: 'USER' },
  });

  const password = useWatch({ control: form.control, name: 'password' });
  const adminValue = useWatch({ control: form.control, name: 'role' }) === 'ADMIN';

  const passwordRules = [
    {
      id: 'min',
      label: t('profile.validation.passwordMin'),
      met: (password?.length ?? 0) >= 8,
    },
    {
      id: 'capital',
      label: t('profile.validation.passwordCapital'),
      met: /[A-Z]/.test(password ?? ''),
    },
    {
      id: 'number',
      label: t('profile.validation.passwordNumber'),
      met: /[0-9]/.test(password ?? ''),
    },
    {
      id: 'special',
      label: t('profile.validation.passwordSpecial'),
      met: /[^A-Za-z0-9]/.test(password ?? ''),
    },
  ];

  const handleAdminToggle = () => {
    if (!adminValue) {
      setConfirmAdminOpen(true);
    } else {
      form.setValue('role', 'USER');
    }
  };

  const confirmAdmin = () => {
    form.setValue('role', 'ADMIN');
    setConfirmAdminOpen(false);
  };

  const fetchModels = async () => {
    try {
      const res = await fetch(`${baseUrl}/users/models`, { credentials: 'include' });
      if (res.ok) setModels(await res.json());
    } catch {
      // models stay empty
    }
  };

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      const response = await fetch(`${baseUrl}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error(t('admin.createUser.emailConflict'));
        }
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message ?? t('admin.createUser.error'));
      }

      const created = await response.json();
      setCreatedUserId(created.id);
      await fetchModels();
      toast.success(t('admin.createUser.success'));
      setStep('tokens');
    } catch (err) {
      const message = err instanceof Error ? err.message : t('admin.createUser.error');
      toast.error(message);
    }
  });

  const resetTokenForm = () => {
    setTokenProvider('');
    setDollarLimit('');
  };

  const handleAddBudget = async () => {
    if (!createdUserId || !tokenProvider) return;
    setSubmittingToken(true);
    try {
      const res = await fetch(`${baseUrl}/users/${createdUserId}/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          provider: tokenProvider,
          dollarLimit: dollarLimit ? Number(dollarLimit) : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message);
      }
      const newBudget = await res.json();
      setAddedBudgets((prev) => [...prev, newBudget]);
      resetTokenForm();
      setShowTokenForm(false);
      toast.success(t('admin.manageTokens.addSuccess'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('admin.manageTokens.addError'));
    } finally {
      setSubmittingToken(false);
    }
  };

  const handleDone = () => {
    handleOpenChange(false);
    onCreated?.();
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.reset();
      setShowPassword(false);
      setStep('form');
      setCreatedUserId(null);
      setModels([]);
      setAddedBudgets([]);
      setShowTokenForm(false);
      resetTokenForm();
    }
    setOpen(next);
  };

  const coveredProviders = new Set(addedBudgets.map((b) => b.model.provider));
  const availableProviders = models.filter(
    (m, index, allModels) =>
      !coveredProviders.has(m.provider) &&
      index === allModels.findIndex((candidate) => candidate.provider === m.provider),
  );

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="border-white/70 bg-transparent text-white hover:border-white hover:bg-white hover:text-slate-900">
            <UserPlus size={16} className="mr-2" />
            {t('admin.createUser.trigger')}
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {step === 'form' ? <UserPlus size={20} /> : <Coins size={20} />}
              {step === 'form'
                ? t('admin.createUser.title')
                : t('admin.createUser.tokenStep.title')}
            </DialogTitle>
            <DialogDescription>
              {step === 'form'
                ? t('admin.createUser.description')
                : t('admin.createUser.tokenStep.description')}
            </DialogDescription>
          </DialogHeader>

          {step === 'form' && (
            <Form {...form} onSubmit={onSubmit}>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.login.email')}</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="user@example.com" {...field} />
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
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input type={showPassword ? 'text' : 'password'} {...field} />
                            <button
                              type="button"
                              onClick={() => setShowPassword((v) => !v)}
                              aria-label={
                                showPassword
                                  ? t('profile.hideNewPassword')
                                  : t('profile.showNewPassword')
                              }
                              aria-pressed={showPassword}
                              className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2">
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const pwd = generatePassword();
                              form.setValue('password', pwd, { shouldValidate: true });
                              setShowPassword(true);
                            }}
                            title={t('admin.createUser.generatePassword')}>
                            <RefreshCw size={16} />
                          </Button>
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
                  control={form.control}
                  name="role"
                  render={() => (
                    <FormItem>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleAdminToggle}
                          aria-pressed={adminValue}
                          className="hover:text-foreground flex items-center gap-2 text-sm transition-colors">
                          {adminValue ? (
                            <CheckSquare size={18} className="text-primary" />
                          ) : (
                            <Square size={18} className="text-muted-foreground" />
                          )}
                          <span>{t('admin.createUser.makeAdmin')}</span>
                        </button>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}>
                  {t('profile.cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="outline"
                  disabled={form.formState.isSubmitting}
                  className="border-white/70 bg-transparent text-white hover:border-white hover:bg-white hover:text-slate-900">
                  {t('admin.createUser.submit')}
                </Button>
              </DialogFooter>
            </Form>
          )}

          {step === 'tokens' && (
            <>
              <div className="space-y-3">
                {addedBudgets.length > 0 && (
                  <div className="space-y-2">
                    {addedBudgets.map((budget) => (
                      <div
                        key={budget.id}
                        className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                        <div>
                          <p className="font-medium">
                            {fmtProvider(budget.model.provider)}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {budget.dollarLimit != null
                              ? `$${Number(budget.dollarLimit).toFixed(2)}`
                              : '∞'}{' '}
                            {t('admin.manageTokens.dollars')}
                            {' · '}
                            {t('admin.manageTokens.resetLabel')}{' '}
                            {new Date(budget.resetAt).toLocaleDateString(undefined, {
                              timeZone: 'UTC',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {showTokenForm && (
                  <div className="space-y-3 rounded-md border p-3">
                    <div className="space-y-1.5">
                      <Label>{t('admin.manageTokens.model')}</Label>
                      <Select value={tokenProvider} onValueChange={setTokenProvider}>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('admin.manageTokens.selectModel')}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {availableProviders.map((m) => (
                            <SelectItem key={m.provider} value={m.provider}>
                              {fmtProvider(m.provider)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t('admin.manageTokens.dollarLimit')}</Label>
                      <Input
                        type="number"
                        min={0.01}
                        step={0.01}
                        value={dollarLimit}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || /^\d*\.?\d{0,2}$/.test(val))
                            setDollarLimit(val);
                        }}
                        placeholder="∞"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={submittingToken || !tokenProvider}
                        className="border-white/70 bg-transparent text-white hover:border-white hover:bg-white hover:text-slate-900"
                        onClick={handleAddBudget}>
                        {t('admin.manageTokens.addSubmit')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowTokenForm(false);
                          resetTokenForm();
                        }}>
                        {t('profile.cancel')}
                      </Button>
                    </div>
                  </div>
                )}

                {!showTokenForm && availableProviders.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowTokenForm(true)}>
                    <Plus size={14} className="mr-1" />
                    {t('admin.manageTokens.add')}
                  </Button>
                )}
              </div>

              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDone}
                  className="border-white/70 bg-transparent text-white hover:border-white hover:bg-white hover:text-slate-900">
                  {t('admin.createUser.tokenStep.done')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmAdminOpen} onOpenChange={setConfirmAdminOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('admin.createUser.confirmAdmin.title')}</DialogTitle>
            <DialogDescription>
              {t('admin.createUser.confirmAdmin.description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAdminOpen(false)}>
              {t('profile.cancel')}
            </Button>
            <Button
              variant="outline"
              onClick={confirmAdmin}
              className="border-white/70 bg-transparent text-white hover:border-white hover:bg-white hover:text-slate-900">
              {t('admin.createUser.confirmAdmin.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
