"use client";

import { useActionState, useState } from "react";
import { SubmitButton, TextField, InfoBox } from "@/components/ui";
import {
  resetPasswordAction,
  signInAction,
  updatePasswordAction,
  type AuthFormState,
} from "@/lib/admin/auth-actions";

type Mode = "login" | "reset";

function Message({ state }: { state: AuthFormState }) {
  if (!state.message) return null;
  return (
    <div aria-live="polite">
      <InfoBox tone={state.ok ? "success" : "danger"}>{state.message}</InfoBox>
    </div>
  );
}

export function LoginForms() {
  const [mode, setMode] = useState<Mode>("login");
  const [loginState, login] = useActionState(signInAction, {});
  const [resetState, reset] = useActionState(resetPasswordAction, {});

  return (
    <div className="space-y-6">
      {mode === "login" && (
        <form action={login} className="space-y-4">
          <TextField label="E-post" name="email" type="email" autoComplete="username" required />
          <TextField label="Lösenord" name="password" type="password" autoComplete="current-password" required />
          <Message state={loginState} />
          <SubmitButton fullWidth pendingText="Loggar in …">
            Logga in
          </SubmitButton>
        </form>
      )}
      {mode === "reset" && (
        <form action={reset} className="space-y-4">
          <TextField label="E-post" name="email" type="email" autoComplete="username" required />
          <Message state={resetState} />
          <SubmitButton fullWidth pendingText="Skickar …">
            Skicka länk för nytt lösenord
          </SubmitButton>
        </form>
      )}
      <nav aria-label="Andra alternativ" className="flex flex-wrap gap-x-6 gap-y-2">
        {mode !== "login" && (
          <button type="button" className="link min-h-12" onClick={() => setMode("login")}>
            Logga in
          </button>
        )}
        {mode !== "reset" && (
          <button type="button" className="link min-h-12" onClick={() => setMode("reset")}>
            Glömt lösenordet?
          </button>
        )}
      </nav>
    </div>
  );
}

export function NewPasswordForm() {
  const [state, action] = useActionState(updatePasswordAction, {});
  return (
    <form action={action} className="space-y-4">
      <TextField
        label="Nytt lösenord"
        name="password"
        type="password"
        autoComplete="new-password"
        hint="Minst 12 tecken."
        minLength={12}
        required
      />
      <Message state={state} />
      <SubmitButton fullWidth pendingText="Sparar …">
        Spara lösenord
      </SubmitButton>
    </form>
  );
}
