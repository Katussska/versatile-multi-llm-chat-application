import { useEffect, useState } from 'react';

import { type AdminUser } from '@/components/admin/UserSearchList.tsx';
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
import { getApiBaseUrl } from '@/lib/api-url.ts';

import { ArrowLeft, DollarSign, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface BudgetLimit {
  id: string;
  dollarLimit: number | null;
  usedDollars: number;
  resetAt: string;
}

type ViewState = 'view' | 'edit';

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
  const [view, setView] = useState<ViewState>('view');
  const [budget, setBudget] = useState<BudgetLimit | null>(null);
  const [loadingBudget, setLoadingBudget] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dollarLimit, setDollarLimit] = useState('');

  const baseUrl = getApiBaseUrl();

  const fetchBudget = async (userId: string, autoEdit = false) => {
    setLoadingBudget(true);
    try {
      const res = await fetch(`${baseUrl}/users/${userId}/tokens`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error();
      const data: BudgetLimit[] = await res.json();
      const fetched = data[0] ?? null;
      setBudget(fetched);
      if (autoEdit && !fetched) setView('edit');
    } catch {
      toast.error(t('admin.manageTokens.loadError'));
    } finally {
      setLoadingBudget(false);
    }
  };

  useEffect(() => {
    if (open) {
      setView('view');
      fetchBudget(user.id, true);
    }
  }, [open, user]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setView('view');
      setBudget(null);
      setDollarLimit('');
    }
    onOpenChange(next);
  };

  const handleDelete = async () => {
    if (!budget) return;
    try {
      const res = await fetch(`${baseUrl}/users/${user.id}/tokens/${budget.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error();
      toast.success(t('admin.manageTokens.deleteSuccess'));
      setBudget(null);
      onUpdated?.();
    } catch {
      toast.error(t('admin.manageTokens.deleteError'));
    }
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const body = JSON.stringify({ dollarLimit: dollarLimit ? Number(dollarLimit) : null });

      let res: Response;
      if (budget) {
        res = await fetch(`${baseUrl}/users/${user.id}/tokens/${budget.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body,
        });
      } else {
        res = await fetch(`${baseUrl}/users/${user.id}/tokens`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body,
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message);
      }

      toast.success(t('admin.manageTokens.editSuccess'));
      await fetchBudget(user.id);
      onUpdated?.();
      setView('view');
      setDollarLimit('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('admin.manageTokens.editError'));
    } finally {
      setSubmitting(false);
    }
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
            {view === 'edit' && (
              <button
                type="button"
                onClick={() => { setView('view'); setDollarLimit(''); }}
                className="text-muted-foreground hover:text-foreground mr-1 rounded p-0.5"
                aria-label={t('admin.manageTokens.back')}>
                <ArrowLeft size={16} />
              </button>
            )}
            <DollarSign size={20} />
            {view === 'edit'
              ? t('admin.manageTokens.editTitle')
              : t('admin.manageTokens.titleSelected', { email: user.email })}
          </DialogTitle>
        </DialogHeader>

        {view === 'view' && (
          <div className="space-y-3">
            {loadingBudget ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                {t('admin.manageTokens.loading')}
              </p>
            ) : budget ? (
              <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">
                    ${fmtDollars(budget.usedDollars)} /{' '}
                    {budget.dollarLimit != null
                      ? `$${fmtDollars(budget.dollarLimit)} ${t('admin.manageTokens.dollars')}`
                      : t('admin.userTable.noLimit')}
                    {' · '}
                    {t('admin.manageTokens.resetLabel')}{' '}
                    {new Date(budget.resetAt).toLocaleDateString(undefined, { timeZone: 'UTC' })}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setDollarLimit(budget.dollarLimit != null ? String(budget.dollarLimit) : '');
                      setView('edit');
                    }}>
                    <Pencil size={14} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleDelete}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground py-2 text-center text-sm">
                {t('admin.manageTokens.empty')}
              </p>
            )}
            {!budget && !loadingBudget && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => { setDollarLimit(''); setView('edit'); }}>
                {t('admin.manageTokens.add')}
              </Button>
            )}
          </div>
        )}

        {view === 'edit' && (
          <>
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
            <DialogFooter className="mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setView('view'); setDollarLimit(''); }}>
                {t('profile.cancel')}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                className="border-white/70 bg-transparent text-white hover:border-white hover:bg-white hover:text-slate-900"
                onClick={handleSave}>
                {t('admin.manageTokens.editSubmit')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
