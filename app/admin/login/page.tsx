import type { Metadata } from "next";
import { Card, Container } from "@/components/ui";
import { Logo } from "@/components/layout";
import { LoginForms } from "@/components/admin/AuthForms";

export const metadata: Metadata = {
  title: "Logga in – administration",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <Container className="max-w-md py-10">
      <div className="mb-6">
        <Logo />
      </div>
      <Card>
        <h1 className="mb-4 text-2xl font-bold">Administration</h1>
        <LoginForms />
      </Card>
    </Container>
  );
}
