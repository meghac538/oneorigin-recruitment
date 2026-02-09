import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function InterviewRedirect({ params }: Props) {
  const { token } = await params;
  redirect(`/candidate?t=${token}`);
}
