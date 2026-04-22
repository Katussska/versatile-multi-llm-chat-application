import { ArrowLeft, Coins, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';

interface ModelOption {
  id: string;
  name: string;
  provider: string;
}

interface TokenLimit {
  id: string;
  model: ModelOption;
  tokenCount: number | null;
  usedTokens: number;
  resetAt: string;
}

type ViewState = 'list' | 'add' | 'edit';

interface ManageTokensDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser;
  onUpdated?: () => void;
}

export default function ManageTokensDialog({ open, onOpenChange, user, onUpdated }: ManageTokensDialogProps) {
  const { t } = useTranslation();
  const [view, setView] = useState<ViewState>('list');
  const [models, setModels] = useState<ModelOption[]>([]);
  const [tokens, setTokens] = useState<TokenLimit[]>([]);
  const [editingToken, setEditingToken] = useState<TokenLimit | null>(null);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modelId, setModelId] = useState('');
  const [tokenCount, setTokenCount] = useState('');

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

  const fetchTokens = async (userId: string) => {
    setLoadingTokens(true);
    try {
      const res = await fetch(`${baseUrl}/users/${userId}/tokens`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      setTokens(await res.json());
    } catch {
      toast.error(t('admin.manageTokens.loadError'));
    } finally {
      setLoadingTokens(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchTokens(user.id);
      fetchModels();
      setView('list');
    }
  }, [open, user]);

  const resetForm = () => {
    setModelId('');
    setTokenCount('');
  };

  const handleBack = () => {
    setView('list');
    setEditingToken(null);
    resetForm();
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setView('list');
      setTokens([]);
      setEditingToken(null);
      resetForm();
    }
    onOpenChange(next);
  };

  const handleDelete = async (tokenId: string) => {
    try {
      const res = await fetch(`${baseUrl}/users/${user.id}/tokens/${tokenId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error();
      toast.success(t('admin.manageTokens.deleteSuccess'));
      fetchTokens(user.id);
      onUpdated?.();
    } catch {
      toast.error(t('admin.manageTokens.deleteError'));
    }
  };

  const handleAdd = async () => {
    if (!modelId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${baseUrl}/users/${user.id}/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ modelId, tokenCount: tokenCount ? Number(tokenCount) : null }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message);
      }
      toast.success(t('admin.manageTokens.addSuccess'));
      fetchTokens(user.id);
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
    if (!editingToken) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${baseUrl}/users/${user.id}/tokens/${editingToken.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tokenCount: tokenCount ? Number(tokenCount) : null }),
      });
      if (!res.ok) throw new Error();
      toast.success(t('admin.manageTokens.editSuccess'));
      fetchTokens(user.id);
      onUpdated?.();
      setView('list');
      setEditingToken(null);
      resetForm();
    } catch {
      toast.error(t('admin.manageTokens.editError'));
    } finally {
      setSubmitting(false);
    }
  };

  const availableModels = models.filter((m) => !tokens.some((t) => t.model.id === m.id));

  const titleKey: Record<ViewState, string> = {
    list: 'admin.manageTokens.titleSelected',
    add: 'admin.manageTokens.addTitle',
    edit: 'admin.manageTokens.editTitle',
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {view !== 'list' && (
              <button
                type="button"
                onClick={handleBack}
                className="mr-1 rounded p-0.5 text-muted-foreground hover:text-foreground"
                aria-label={t('admin.editUser.back')}
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <Coins size={20} />
            {t(titleKey[view], { email: user.email })}
          </DialogTitle>
        </DialogHeader>

        {view === 'list' && (
          <div className="space-y-3">
            {loadingTokens ? (
              <p className="py-4 text-center text-sm text-muted-foreground">{t('admin.manageTokens.loading')}</p>
            ) : tokens.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">{t('admin.manageTokens.empty')}</p>
            ) : (
              <div className="space-y-2">
                {tokens.map((token) => (
                  <div key={token.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium">{token.model.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {token.usedTokens.toLocaleString()} / {token.tokenCount != null ? token.tokenCount.toLocaleString() : '∞'} {t('admin.manageTokens.tokens')}
                        {' · '}{t('admin.manageTokens.resetLabel')} {new Date(token.resetAt).toLocaleDateString(undefined, { timeZone: 'UTC' })}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingToken(token); setTokenCount(token.tokenCount != null ? String(token.tokenCount) : ''); setView('edit'); }}>
                        <Pencil size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(token.id)}>
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
              onClick={() => { resetForm(); setEditingToken(null); setView('add'); }}
              disabled={availableModels.length === 0}
            >
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
                <Select value={modelId} onValueChange={setModelId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('admin.manageTokens.selectModel')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name} ({m.provider})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {view === 'edit' && editingToken && (
              <div className="space-y-1.5">
                <Label>{t('admin.manageTokens.model')}</Label>
                <p className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
                  {editingToken.model.name} ({editingToken.model.provider})
                </p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>{t('admin.manageTokens.tokenCount')}</Label>
              <Input
                type="number"
                min={1}
                value={tokenCount}
                onChange={(e) => setTokenCount(e.target.value)}
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
              disabled={submitting || (view === 'add' && !modelId)}
              className="border-white/70 bg-transparent text-white hover:border-white hover:bg-white hover:text-slate-900"
              onClick={view === 'add' ? handleAdd : handleEdit}
            >
              {view === 'add' ? t('admin.manageTokens.addSubmit') : t('admin.manageTokens.editSubmit')}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
