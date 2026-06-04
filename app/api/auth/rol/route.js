import { getUserEmail, getUserId, getUserRole, successResponse } from "../../../../lib/apiUtils";

export async function GET(request) {
  const userId = getUserId(request);
  const role = getUserRole(request);
  const email = getUserEmail(request);

  return successResponse({
    rol: role,
    autenticado: Boolean(userId),
    email,
    userId,
    authMode: "demo",
  });
}
