"use client";

import { useActionState, useState } from "react";
import { createAdminUserAction, type AdminUserFormState } from "@/lib/admin/config-actions";
import { ADMIN_PASSWORD_MIN, generatePassword } from "@/lib/admin/password";
import { selectClasses } from "./bits";

/**
 * "Skapa konto": the only way to give someone access to the admin. The owner chooses the email
 * and a password (or generates one) and hands both over personally.
 */
export function CreateAdminForm() {
  const [state, action, pending] = useActionState<AdminUserFormState, FormData>(createAdminUserAction, {});
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);

  return (
    <form action={action} className="space-y-3">
      <h3 className="text-lg font-bold">Skapa konto</h3>
      <label className="block">
        <span className="mb-1 block font-bold">E-post (användarnamn)</span>
        <input name="email" type="email" required autoComplete="off" className={selectClasses} />
      </label>
      <label className="block">
        <span className="mb-1 block font-bold">Lösenord</span>
        <input
          name="password"
          type={visible ? "text" : "password"}
          required
          minLength={ADMIN_PASSWORD_MIN}
          maxLength={72}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.currentTarget.value)}
          className={selectClasses}
        />
        <span className="mt-1 block text-sm text-muted">Minst {ADMIN_PASSWORD_MIN} tecken.</span>
      </label>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="min-h-12 rounded-control border-2 border-brand bg-surface px-4 font-semibold text-brand"
          onClick={() => {
            setPassword(generatePassword());
            setVisible(true);
          }}
        >
          Skapa ett säkert lösenord
        </button>
        <button type="button" className="link min-h-12" onClick={() => setVisible((v) => !v)}>
          {visible ? "Dölj lösenordet" : "Visa lösenordet"}
        </button>
      </div>
      {state.message && (
        <p
          role="status"
          className={`rounded-control border-2 p-3 font-bold ${
            state.ok ? "border-success bg-success-soft text-success" : "border-danger bg-danger-soft text-danger"
          }`}
        >
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-control border-2 border-brand bg-brand px-5 font-semibold text-on-brand disabled:opacity-60"
      >
        {pending ? "Skapar …" : "Skapa konto"}
      </button>
    </form>
  );
}
