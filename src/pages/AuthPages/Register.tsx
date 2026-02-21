import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import RegisterForm from "../../components/auth/RegisterForm";

export default function Register() {
  return (
    <>
      <PageMeta
        title="Patients-MS Register | Create Super Admin Account"
        description="Register for Patients-MS Super Admin Panel to access healthcare management tools."
      />
      <AuthLayout>
        <RegisterForm />
      </AuthLayout>
    </>
  );
}
