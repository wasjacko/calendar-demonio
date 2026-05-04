#!/usr/bin/env node
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();

console.log("\n🔑 Clés VAPID générées — copie ces valeurs dans .env.local et Vercel\n");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY="${keys.publicKey}"`);
console.log(`VAPID_PRIVATE_KEY="${keys.privateKey}"`);
console.log(`VAPID_SUBJECT="mailto:ton@email.com"`);
console.log("\nLa clé publique part au navigateur, la privée reste sur le serveur.\n");
