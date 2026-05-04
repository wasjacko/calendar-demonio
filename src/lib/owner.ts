// Identifiant fixe du propriétaire de l'app (mode mono-user)
// L'app entière utilise cet UUID comme user_id pour toutes les opérations.
// La protection est l'obscurité de l'URL — tu es le seul à la connaître.

export const OWNER_USER_ID = process.env.NEXT_PUBLIC_OWNER_USER_ID!;

if (typeof window === "undefined" && !OWNER_USER_ID) {
  console.warn("NEXT_PUBLIC_OWNER_USER_ID is not set");
}
