import { Suspense } from "react";
import { InfoIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Use your staff account to continue.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {/* searchParams is request-time data, so it streams in behind Suspense. */}
        <Suspense>
          <ExpiredNotice searchParams={props.searchParams} />
        </Suspense>
        <LoginForm />
      </CardContent>
    </Card>
  );
}

async function ExpiredNotice({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  const { expired } = await searchParams;
  if (!expired) return null;

  return (
    <Alert>
      <InfoIcon />
      <AlertDescription>
        Your session ended. Please sign in again.
      </AlertDescription>
    </Alert>
  );
}
