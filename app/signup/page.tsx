import AuthForm from '../../components/AuthForm';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-12">
      <AuthForm mode="signup" />
    </div>
  );
}
