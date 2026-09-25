import { Suspense } from "react";

import { LoginForm } from "./_components/login-form";

export const metadata = { title: "Нэвтрэх · Car Wash" };

// A Server Component that composes one Client Component, per the reference's
// convention: keep page.tsx thin and push interactivity down.
export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <div className="flex size-12 items-center justify-center rounded-xl border border-border bg-muted font-mono text-[11px] text-muted-foreground">
          CW
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Тавтай морил</h1>
        <p className="text-sm text-muted-foreground">
          Харилцагч, ажилтан, менежер бүгд энд нэвтэрнэ. Таны эрхээс шалтгаалж өөр өөр хуудас руу шилжинэ.
        </p>
      </div>

      {/* useSearchParams needs a Suspense boundary around the component that
          reads it, or the whole route opts out of static rendering. */}
      <Suspense fallback={<div className="h-72" />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
