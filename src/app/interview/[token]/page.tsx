import { redirect } from "next/navigation";

type Props = {
  params: { token: string };
};

export default function InterviewRedirect({ params }: Props) {
  const token = params.token;
  redirect(`/candidate?t=${token}`);
}
