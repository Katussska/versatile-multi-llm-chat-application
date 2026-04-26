import { useEffect, useState } from 'react';

import { type AdminUser } from '@/components/admin/UserSearchList.tsx';
import { fmtProvider } from '@/lib/formatModel';
import { Button } from '@/components/ui/button.tsx';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';

import { ArrowLeft, DollarSign, Pencil, Plus, Trash2 } from 'lucide-react';
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

type ViewState = 'list' | 'add' | 'edit';

interface ManageTokensDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser;
  onUpdated?: () => void;
}

export default function ManageTokensDialog({
  open,
  onOpenChange,
  user,
  onUpdated,
}: ManageTokensDialogProps) {
  const { t } = useTranslation();
  const [view, setView] = useState<ViewState>('list');
  const [models, setModels] = useState<ModelOption[]>([]);
  const [budgets, setBudgets] = useState<BudgetLimit[]>([]);
  const [editingBudget, setEditingBudget] = useState<BudgetLimit | null>(null);
  const [loadingBudgets, setLoadingBudgets] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [provider, setProvider] = useState('');
  const [dollarLimit, setDollarLimit] = useState('');

  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  const fetchModels = async () => {
    try {
      const res = await fetch(`${baseUrl}/users/models`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      setModels(await res.json());
    } catch {
      // ignore — model list stays empty
    }
  };

  const fetchBudgets = async (userId: string) => {
    setLoadingBudgets(true);
    try {
      const res = await fetch(`${baseUrl}/users/${userId}/tokens`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error();
      setBudgets(await res.json());
    } catch {
      toast.error(t('admin.manageTokens.loadError'));
    } finally {
      setLoadingBudgets(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchBudgets(user.id);
      fetchModels();
      setView('list');
    }
  }, [open, user]);

  const resetForm = () => {
    setProvider('');
    setDollarLimit('');
  };

  const handleBack = () => {
    setView('list');
    setEditingBudget(null);
    resetForm();
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setView('list');
      setBudgets([]);
      setEditingBudget(null);
      resetForm();
    }
    onOpenChange(next);
  };

  const handleDelete = async (budgetId: string) => {
    try {
      const res = await fetch(`${baseUrl}/users/${user.id}/tokens/${budgetId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error();
      toast.success(t('admin.manageTokens.deleteSuccess'));
      fetchBudgets(user.id);
      onUpdated?.();
    } catch {
      toast.error(t('admin.manageTokens.deleteError'));
    }
  };

  const handleAdd = async () => {
    if (!provider) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${baseUrl}/users/${user.id}/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          provider,
          dollarLimit: dollarLimit ? Number(dollarLimit) : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message);
      }
      toast.success(t('admin.manageTokens.addSuccess'));
      fetchBudgets(user.id);
      onUpdated?.();
      setView('list');
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('admin.manageTokens.addError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editingBudget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${baseUrl}/users/${user.id}/tokens/${editingBudget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ dollarLimit: dollarLimit ? Number(dollarLimit) : null }),
      });
      if (!res.ok) throw new Error();
      toast.success(t('admin.manageTokens.editSuccess'));
      fetchBudgets(user.id);
      onUpdated?.();
      setView('list');
      setEditingBudget(null);
      resetForm();
    } catch {
      toast.error(t('admin.manageTokens.editError'));
    } finally {
      setSubmitting(false);
    }
  };

  const coveredProviders = new Set(budgets.map((b) => b.model.provider));
  const availableProviders = models.filter(
    (m, index, allModels) =>
      !coveredProviders.has(m.provider) &&
      index === allModels.findIndex((candidate) => candidate.provider === m.provider),
  );

  const titleKey: Record<ViewState, string> = {
    list: 'admin.manageTokens.titleSelected',
    add: 'admin.manageTokens.addTitle',
    edit: 'admin.manageTokens.editTitle',
  };

  const fmtDollars = (v: number) =>
    Number(v).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {view !== 'list' && (
              <button
                type="button"
                onClick={handleBack}
                className="text-muted-foreground hover:text-foreground mr-1 rounded p-0.5"
                aria-label={t('admin.manageTokens.back')}>
                <ArrowLeft size={16} />
              </button>
            )}
            <DollarSign size={20} />
            {t(titleKey[view], { email: user.email })}
          </DialogTitle>
        </DialogHeader>

        {view === 'list' && (
          <div className="space-y-3">
            {loadingBudgets ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                {t('admin.manageTokens.loading')}
              </p>
            ) : budgets.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                {t('admin.manageTokens.empty')}
              </p>
            ) : (
              <div className="space-y-2">
                {budgets.map((budget) => (
                  <div
                    key={budget.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium">{fmtProvider(budget.model.provider)}</p>
                      <p className="text-muted-foreground text-xs">
                        ${fmtDollars(budget.usedDollars)} /{' '}
                        {budget.dollarLimit != null
                          ? `$${fmtDollars(budget.dollarLimit)}`
                          : '∞'}{' '}
                        {t('admin.manageTokens.dollars')}
                        {' · '}
                        {t('admin.manageTokens.resetLabel')}{' '}
                        {new Date(budget.resetAt).toLocaleDateString(undefined, {
                          timeZone: 'UTC',
                        })}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingBudget(budget);
                          setDollarLimit(
                            budget.dollarLimit != null ? String(budget.dollarLimit) : '',
                          );
                          setView('edit');
                        }}>
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(budget.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                resetForm();
                setEditingBudget(null);
                setView('add');
              }}
              disabled={availableProviders.length === 0}>
              <Plus size={14} className="mr-1" />
              {t('admin.manageTokens.add')}
            </Button>
          </div>
        )}

        {(view === 'add' || view === 'edit') && (
          <div className="space-y-4">
            {view === 'add' && (
              <div className="space-y-1.5">
                <Label>{t('admin.manageTokens.model')}</Label>
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('admin.manageTokens.selectModel')} />
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
            )}
            {view === 'edit' && editingBudget && (
              <div className="space-y-1.5">
                <Label>{t('admin.manageTokens.model')}</Label>
                <p className="bg-muted text-muted-foreground rounded-md border px-3 py-2 text-sm">
                  {fmtProvider(editingBudget.model.provider)}
                </p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>{t('admin.manageTokens.dollarLimit')}</Label>
              <Input
                type="number"
                min={0.01}
                step={0.01}
                value={dollarLimit}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) setDollarLimit(val);
                }}
                placeholder="∞"
              />
            </div>
          </div>
        )}

        {(view === 'add' || view === 'edit') && (
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={handleBack}>
              {t('profile.cancel')}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={submitting || (view === 'add' && !provider)}
              className="border-white/70 bg-transparent text-white hover:border-white hover:bg-white hover:text-slate-900"
              onClick={view === 'add' ? handleAdd : handleEdit}>
              {view === 'add'
                ? t('admin.manageTokens.addSubmit')
                : t('admin.manageTokens.editSubmit')}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
