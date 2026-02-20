import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Prime Health Admin Sign In | Professional Dashboard"
        description="Sign in to the Prime Health Admin Panel for secure access to healthcare management tools."
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}