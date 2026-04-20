import { Coins, Plus, Trash2, ArrowLeft, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
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
  tokenCount: number;
  usedTokens: number;
  resetAt: string;
}

type ViewState = 'users' | 'list' | 'add' | 'edit';

export default function ManageTokensDialog() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<ViewState>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [tokens, setTokens] = useState<TokenLimit[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [editingToken, setEditingToken] = useState<TokenLimit | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [modelId, setModelId] = useState('');
  const [tokenCount, setTokenCount] = useState('');
  const [resetAt, setResetAt] = useState('');

  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${baseUrl}/users`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      setUsers(await res.json());
    } catch {
      toast.error(t('admin.userList.loadError'));
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchModels = async () => {
    try {
      const res = await fetch(`${baseUrl}/users/models`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      setModels(await res.json());
    } catch {
      // models stay empty
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
      fetchUsers();
      fetchModels();
    }
  }, [open]);

  const handleSelectUser = (user: AdminUser) => {
    setSelectedUser(user);
    fetchTokens(user.id);
    setView('list');
  };

  const handleBack = () => {
    if (view === 'list') {
      setSelectedUser(null);
      setTokens([]);
      setView('users');
    } else {
      setView('list');
      setEditingToken(null);
      resetForm();
    }
  };

  const resetForm = () => {
    setModelId('');
    setTokenCount('');
    setResetAt('');
  };

  const handleAddClick = () => {
    resetForm();
    setEditingToken(null);
    setView('add');
  };

  const handleEditClick = (token: TokenLimit) => {
    setEditingToken(token);
    setTokenCount(String(token.tokenCount));
    setResetAt(token.resetAt.slice(0, 10));
    setView('edit');
  };

  const handleDelete = async (tokenId: string) => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`${baseUrl}/users/${selectedUser.id}/tokens/${tokenId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error();
      toast.success(t('admin.manageTokens.deleteSuccess'));
      fetchTokens(selectedUser.id);
    } catch {
      toast.error(t('admin.manageTokens.deleteError'));
    }
  };

  const handleAdd = async () => {
    if (!selectedUser || !modelId || !tokenCount || !resetAt) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${baseUrl}/users/${selectedUser.id}/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ modelId, tokenCount: Number(tokenCount), resetAt }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message);
      }
      toast.success(t('admin.manageTokens.addSuccess'));
      fetchTokens(selectedUser.id);
      setView('list');
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('admin.manageTokens.addError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedUser || !editingToken || !tokenCount || !resetAt) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${baseUrl}/users/${selectedUser.id}/tokens/${editingToken.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tokenCount: Number(tokenCount), resetAt }),
      });
      if (!res.ok) throw new Error();
      toast.success(t('admin.manageTokens.editSuccess'));
      fetchTokens(selectedUser.id);
      setView('list');
      setEditingToken(null);
      resetForm();
    } catch {
      toast.error(t('admin.manageTokens.editError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setView('users');
      setSelectedUser(null);
      setTokens([]);
      setEditingToken(null);
      resetForm();
    }
    setOpen(next);
  };

  const availableModels = models.filter((m) => !tokens.some((t) => t.model.id === m.id));

  const titleKey: Record<ViewState, string> = {
    users: 'admin.manageTokens.title',
    list: 'admin.manageTokens.titleSelected',
    add: 'admin.manageTokens.addTitle',
    edit: 'admin.manageTokens.editTitle',
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-white/70 bg-transparent text-white hover:border-white hover:bg-white hover:text-slate-900"
        >
          <Coins size={16} className="mr-2" />
          {t('admin.manageTokens.trigger')}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {view !== 'users' && (
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
            {t(titleKey[view], { email: selectedUser?.email ?? '' })}
          </DialogTitle>
          {view === 'users' && (
            <DialogDescription>{t('admin.manageTokens.description')}</DialogDescription>
          )}
        </DialogHeader>

        {view === 'users' && (
          loadingUsers ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{t('admin.userList.loading')}</p>
          ) : (
            <UserSearchList users={users} renderAction={(user) => (
              <Button variant="outline" size="sm" onClick={() => handleSelectUser(user)}>
                {t('admin.editUser.select')}
              </Button>
            )} />
          )
        )}

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
                        {token.usedTokens.toLocaleString()} / {token.tokenCount.toLocaleString()} {t('admin.manageTokens.tokens')}
                        {' · '}{t('admin.manageTokens.resetLabel')} {new Date(token.resetAt).toLocaleDateString(undefined, { timeZone: 'UTC' })}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(token)}>
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
              onClick={handleAddClick}
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
                placeholder="100000"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('admin.manageTokens.resetAt')}</Label>
              <Input
                type="date"
                value={resetAt}
                onChange={(e) => setResetAt(e.target.value)}
                className="[color-scheme:inherit]"
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
              disabled={submitting || !tokenCount || !resetAt || (view === 'add' && !modelId)}
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
