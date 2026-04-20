import { Trash2, UserX } from 'lucide-react';
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

interface DeleteUserDialogProps {
  onDeleted?: () => void;
}

export default function DeleteUserDialog({ onDeleted }: DeleteUserDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!pendingUser) return;
    setDeleting(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(`${baseUrl}/users/${pendingUser.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? t('admin.deleteUser.error'));
      }

      toast.success(t('admin.deleteUser.success'));
      setPendingUser(null);
      setOpen(false);
      onDeleted?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('admin.deleteUser.error'));
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) setPendingUser(null);
    setOpen(next);
  };

  return (
    <>
      <Dialog open={open && !pendingUser} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="border-white/70 bg-transparent text-white hover:border-white hover:bg-white hover:text-slate-900"
          >
            <Trash2 size={16} className="mr-2" />
            {t('admin.deleteUser.trigger')}
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserX size={20} />
              {t('admin.deleteUser.title')}
            </DialogTitle>
            <DialogDescription>{t('admin.deleteUser.description')}</DialogDescription>
          </DialogHeader>

          {loading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{t('admin.userList.loading')}</p>
          ) : (
            <UserSearchList users={users} renderAction={(user) => (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 border-destructive/50 text-destructive hover:border-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setPendingUser(user)}
              >
                <Trash2 size={14} className="mr-1" />
                {t('admin.deleteUser.deleteBtn')}
              </Button>
            )} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!pendingUser} onOpenChange={(next) => { if (!next) setPendingUser(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('admin.deleteUser.confirmTitle')}</DialogTitle>
            <DialogDescription>
              {t('admin.deleteUser.confirmDescription', { email: pendingUser?.email ?? '' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingUser(null)} disabled={deleting}>
              {t('profile.cancel')}
            </Button>
            <Button
              variant="outline"
              disabled={deleting}
              onClick={handleDelete}
              className="border-destructive/50 text-destructive hover:border-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              {t('admin.deleteUser.confirmBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
