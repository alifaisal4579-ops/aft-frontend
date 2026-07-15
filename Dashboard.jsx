import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Welcome, {user?.email}</h2>
      <p style={{ color: 'var(--muted)', fontSize: 14 }}>
        Your bot dashboard goes here -- create a bot, pick your symbols and
        session, and watch your trades. (Coming next.)
      </p>
    </div>
  );
}
