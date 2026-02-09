import { ReactNode, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    // todo: check if user is logged in
    setIsAuthed(true);
    // supabase.auth.getSession().then(({ data, error }) => {
    //   if (error || !data.session) navigate('/login');
    //   else setIsAuthed(true);
    // });
  }, [navigate]);

  return isAuthed ? children : null;
}
