import { RegistrationForm } from '@/components/rakes/registration-form';
import { RoleGuard } from '@/components/auth/role-guard';

export default function NewRakePage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Senior_Section_Engineer', 'Junior_Engineer']} showAccessDenied>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Register New Rake</h1>
          <p className="mt-0.5 text-xs text-gray-400">
            Create a new POH record for an incoming rake
          </p>
        </div>

        <RegistrationForm />
      </div>
    </RoleGuard>
  );
}
