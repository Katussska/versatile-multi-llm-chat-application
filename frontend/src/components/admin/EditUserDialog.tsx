import { useEffect, useState } from 'react';

import { type AdminUser } from '@/components/admin/UserSearchList.tsx';
import { Button } from '@/components/ui/button.tsx';
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
import { generatePassword } from '@/lib/utils.ts';
import { UpdateUserSchema, updateUserSchema } from '@/schemas/admin.ts';
import { zodResolver } from '@hookform/resolvers/zod';

import { CheckSquare, Eye, EyeOff, Pencil, RefreshCw, Square } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser;
  onUpdated?: () => void;
}

export default function EditUserDialog({
  open,
  onOpenChange,
  user,
  onUpdated,
}: EditUserDialogProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [confirmAdminOpen, setConfirmAdminOpen] = useState(false);
  const [pendingAdminValue, setPendingAdminValue] = useState(false);

  const form = useForm<UpdateUserSchema>({
    resolver: zodResolver(updateUserSchema(t)),
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

  useEffect(() => {
    if (open) {
      form.reset({ email: user.email, password: '', role: user.role });
      setShowPassword(false);
    }
  }, [open, user, form]);

  const handleAdminToggle = () => {
    setPendingAdminValue(!adminValue);
    setConfirmAdminOpen(true);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.reset({ email: '', password: '', role: 'USER' });
      setShowPassword(false);
    }
    onOpenChange(next);
  };

  const onSubmit = form.handleSubmit(async (data) => {
    const body: Record<string, unknown> = {};
    if (data.email && data.email !== user.email) body.email = data.email;
    if (data.password) body.password = data.password;
    if (data.role !== undefined && data.role !== user.role) body.role = data.role;

    if (Object.keys(body).length === 0) {
      toast.info(t('admin.editUser.noChanges'));
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(`${baseUrl}/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? t('admin.editUser.error'));
      }
      toast.success(t('admin.editUser.success'));
      onOpenChange(false);
      onUpdated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('admin.editUser.error'));
    }
  });

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil size={20} />
              {t('admin.editUser.titleSelected', { email: user.email })}
            </DialogTitle>
          </DialogHeader>

          <Form {...form} onSubmit={onSubmit}>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.login.email')}</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
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
                    <FormLabel>{t('admin.editUser.newPassword')}</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder={t('admin.editUser.passwordPlaceholder')}
                            {...field}
                          />
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
                            form.setValue('password', generatePassword(), {
                              shouldValidate: true,
                            });
                            setShowPassword(true);
                          }}
                          title={t('admin.createUser.generatePassword')}>
                          <RefreshCw size={16} />
                        </Button>
                      </div>
                    </FormControl>
                    {(password?.length ?? 0) > 0 && (
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
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={() => (
                  <FormItem>
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
                {t('admin.editUser.submit')}
              </Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmAdminOpen} onOpenChange={setConfirmAdminOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {pendingAdminValue
                ? t('admin.createUser.confirmAdmin.title')
                : t('admin.editUser.confirmRemoveAdmin.title')}
            </DialogTitle>
            <DialogDescription>
              {pendingAdminValue
                ? t('admin.createUser.confirmAdmin.description')
                : t('admin.editUser.confirmRemoveAdmin.description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAdminOpen(false)}>
              {t('profile.cancel')}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                form.setValue('role', pendingAdminValue ? 'ADMIN' : 'USER');
                setConfirmAdminOpen(false);
              }}
              className="border-white/70 bg-transparent text-white hover:border-white hover:bg-white hover:text-slate-900">
              {pendingAdminValue
                ? t('admin.createUser.confirmAdmin.confirm')
                : t('admin.editUser.confirmRemoveAdmin.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
