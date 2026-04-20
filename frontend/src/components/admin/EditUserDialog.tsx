import { UpdateUserSchema, updateUserSchema } from '@/schemas/admin.ts';
import { zodResolver } from '@hookform/resolvers/zod';
import { generatePassword } from '@/lib/utils.ts';
import { ArrowLeft, CheckSquare, Eye, EyeOff, Pencil, RefreshCw, Square } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import UserSearchList, { type AdminUser } from '@/components/admin/UserSearchList.tsx';
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

interface EditUserDialogProps {
  onUpdated?: () => void;
}

export default function EditUserDialog({ onUpdated }: EditUserDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmAdminOpen, setConfirmAdminOpen] = useState(false);
  const [pendingAdminValue, setPendingAdminValue] = useState<boolean>(false);

  const form = useForm<UpdateUserSchema>({
    resolver: zodResolver(updateUserSchema(t)),
    defaultValues: { email: '', password: '', admin: false },
  });

  const password = useWatch({ control: form.control, name: 'password' });
  const adminValue = useWatch({ control: form.control, name: 'admin' });

  const passwordRules = [
    { id: 'min', label: t('profile.validation.passwordMin'), met: (password?.length ?? 0) >= 8 },
    { id: 'capital', label: t('profile.validation.passwordCapital'), met: /[A-Z]/.test(password ?? '') },
    { id: 'number', label: t('profile.validation.passwordNumber'), met: /[0-9]/.test(password ?? '') },
    { id: 'special', label: t('profile.validation.passwordSpecial'), met: /[^A-Za-z0-9]/.test(password ?? '') },
  ];

  const showPasswordRules = (password?.length ?? 0) > 0;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(`${baseUrl}/users`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      setUsers(await res.json());
    } catch {
      toast.error(t('admin.userList.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchUsers();
  }, [open]);

  const handleSelect = (user: AdminUser) => {
    setSelectedUser(user);
    form.reset({ email: user.email, password: '', admin: user.admin });
    setShowPassword(false);
  };

  const handleBack = () => {
    setSelectedUser(null);
    form.reset({ email: '', password: '', admin: false });
  };

  const handleAdminToggle = () => {
    const next = !adminValue;
    setPendingAdminValue(next);
    setConfirmAdminOpen(true);
  };

  const confirmAdminChange = () => {
    form.setValue('admin', pendingAdminValue);
    setConfirmAdminOpen(false);
  };

  const onSubmit = form.handleSubmit(async (data) => {
    if (!selectedUser) return;

    const body: Record<string, unknown> = {};
    if (data.email && data.email !== selectedUser.email) body.email = data.email;
    if (data.password) body.password = data.password;
    if (data.admin !== undefined && data.admin !== selectedUser.admin) body.admin = data.admin;

    if (Object.keys(body).length === 0) {
      toast.info(t('admin.editUser.noChanges'));
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(`${baseUrl}/users/${selectedUser.id}`, {
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
      setOpen(false);
      onUpdated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('admin.editUser.error'));
    }
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSelectedUser(null);
      form.reset({ email: '', password: '', admin: false });
      setShowPassword(false);
    }
    setOpen(next);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="border-white/70 bg-transparent text-white hover:border-white hover:bg-white hover:text-slate-900"
          >
            <Pencil size={16} className="mr-2" />
            {t('admin.editUser.trigger')}
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedUser && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="mr-1 rounded p-0.5 text-muted-foreground hover:text-foreground"
                  aria-label={t('admin.editUser.back')}
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              <Pencil size={20} />
              {selectedUser
                ? t('admin.editUser.titleSelected', { email: selectedUser.email })
                : t('admin.editUser.title')}
            </DialogTitle>
            {!selectedUser && (
              <DialogDescription>{t('admin.editUser.description')}</DialogDescription>
            )}
          </DialogHeader>

          {!selectedUser ? (
            loading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">{t('admin.userList.loading')}</p>
            ) : (
              <UserSearchList users={users} renderAction={(user) => (
                <Button variant="outline" size="sm" onClick={() => handleSelect(user)}>
                  {t('admin.editUser.select')}
                </Button>
              )} />
            )
          ) : (
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
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              form.setValue('password', generatePassword(), { shouldValidate: true });
                              setShowPassword(true);
                            }}
                            title={t('admin.createUser.generatePassword')}
                          >
                            <RefreshCw size={16} />
                          </Button>
                        </div>
                      </FormControl>
                      {showPasswordRules && (
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
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="admin"
                  render={() => (
                    <FormItem>
                      <button
                        type="button"
                        onClick={handleAdminToggle}
                        aria-pressed={adminValue}
                        className="flex items-center gap-2 text-sm transition-colors hover:text-foreground"
                      >
                        {adminValue
                          ? <CheckSquare size={18} className="text-primary" />
                          : <Square size={18} className="text-muted-foreground" />}
                        <span>{t('admin.createUser.makeAdmin')}</span>
                      </button>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  {t('profile.cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="outline"
                  disabled={form.formState.isSubmitting}
                  className="border-white/70 bg-transparent text-white hover:border-white hover:bg-white hover:text-slate-900"
                >
                  {t('admin.editUser.submit')}
                </Button>
              </DialogFooter>
            </Form>
          )}
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
              onClick={confirmAdminChange}
              className="border-white/70 bg-transparent text-white hover:border-white hover:bg-white hover:text-slate-900"
            >
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
