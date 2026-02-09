import { Button } from '@/components/ui/button.tsx';
import { useAuthContext } from '@/lib/authContext.tsx';

export default function ExampleRoute() {
  const { user, session, logOut } = useAuthContext();

  // this should not get displayed ever
  if (!user || !session) return <div>Something went wrong.</div>;

  return (
    <div>
      <Button
        onClick={async () => {
          await logOut();
        }}>
        logout
      </Button>
      <h1>user</h1>
      <table>
        <tbody>
          {Object.entries(user).map(([key, value]) => (
            <tr key={key}>
              <td>{key}</td>
              <td>
                <pre>{JSON.stringify(value, null, 2)}</pre>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h1>session</h1>
      <table>
        <tbody>
          {Object.entries(session).map(([key, value]) => (
            <tr key={key}>
              <td>{key}</td>
              <td>
                <pre>{JSON.stringify(value, null, 2)}</pre>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
