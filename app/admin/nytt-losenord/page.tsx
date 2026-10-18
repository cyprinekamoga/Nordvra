import type { Metadata } from "next";
import { Card, Container } from "@/components/ui";
import { NewPasswordForm } from "@/components/admin/AuthForms";

export const metadata: Metadata = {
  title: "Nytt lösenord | Administration",
  robots: { index: false, follow: false },
};

export default function NewPasswordPage() {
  return (
    <Container className="max-w-md py-10">
      <Card>
        <h1 className="mb-4 text-2xl font-bold">Välj nytt lösenord</h1>
        <NewPasswordForm />
      </Card>
    </Container>
  );
}
