import { createClient } from '@supabase/supabase-js';

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn('RESEND_API_KEY not set — emails will not be sent');
}

// Lightweight resend-like interface (uses fetch, no external dep needed)
async function sendEmail(to: string, subject: string, html: string) {
  if (!resendApiKey) {
    console.log('[EMAIL SKIPPED] No RESEND_API_KEY set:', { to, subject });
    return { id: null };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Nido <noreply@nido.app>',
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err: any = await res.json();
      throw new Error(err.message ?? 'Resend API error');
    }

    const data = await res.json();
    console.log(`[EMAIL SENT] ${subject} → ${to}`);
    return data;
  } catch (err: any) {
    console.error('[EMAIL FAILED]', err.message ?? err);
    throw err;
  }
}

// ── Email templates ────────────────────────────────────────

export async function sendWelcomeEmail(email: string, name: string, circleName: string) {
  await sendEmail(email, '¡Bienvenido a Nido!', `
    <h1>Hola ${name},</h1>
    <p>Tu cuenta en Nido está lista. Ya puedes ver a tu familia "${circleName}" en el mapa.</p>
    <p>Compartir ubicación es gratis y seguro. Tus datos nunca se venden.</p>
    <p>— El equipo de Nido</p>
  `);
}

export async function sendInviteEmail(email: string, circleName: string, joinCode: string) {
  await sendEmail(email, `Te invitaron a ${circleName}`, `
    <h1>¡Te uniste a ${circleName}!</h1>
    <p>Alguien de tu círculo te invitó a Nido.</p>
    <p><strong>Código:</strong> ${joinCode}</p>
    <p>Ingresa este código en la app para unirte.</p>
  `);
}

export async function sendSOSAlert(email: string, memberName: string, circleName: string, lat: number, lon: number) {
  const mapLink = `https://maps.google.com/?q=${lat},${lon}`;
  await sendEmail(email, `SOS de ${memberName} en ${circleName}`, `
    <h1>⚠️ Alerta SOS</h1>
    <p><strong>${memberName}</strong> ha activado una alerta SOS en <strong>${circleName}</strong>.</p>
    <p>Ubicación: <a href="${mapLink}">Ver en mapa</a></p>
    <p>Abre Nido para ver los detalles y ayudar.</p>
  `);
}

export async function sendDriveSummary(email: string, name: string, score: number, drivesCount: number) {
  const grade = score >= 90 ? 'Excelente' : score >= 70 ? 'Bueno' : 'Precaución';
  await sendEmail(email, `Tu resumen de manejo: ${grade}`, `
    <h1>Resumen de manejo</h1>
    <p>Hola ${name}, aquí está tu reporte de seguridad vial esta semana.</p>
    <p><strong>Score:</strong> ${score}/100 — ${grade}</p>
    <p><strong>Manejos registrados:</strong> ${drivesCount}</p>
    <p>Conduce con cuidado. Tu familia te lo agradece.</p>
  `);
}

export async function sendMembershipUpgrade(email: string, name: string, tier: string, amount: number) {
  await sendEmail(email, `¡Tu membresía ${tier} está activa!`, `
    <h1>Bienvenido a Nido ${tier}</h1>
    <p>Hola ${name}, tu membresía ha sido activada.</p>
    <p><strong>Plan:</strong> ${tier}</p>
    <p><strong>Pago:</strong> $${amount.toFixed(2)}/mes</p>
    <p>Puedes administrar tu suscripción desde Configuración → Membresía.</p>
  `);
}

export async function sendPaymentFailed(email: string, tier: string, daysLeft: number) {
  await sendEmail(email, `Problema con tu pago Nido ${tier}`, `
    <h1>⚠️ Pago fallido</h1>
    <p>No pudimos cobrar tu suscripción Nido ${tier}.</p>
    <p>Tienes <strong>${daysLeft} días</strong> para actualizar tu método de pago antes de que se cancele.</p>
    <p>Ve a Configuración → Membresía para cambiar tu tarjeta.</p>
  `);
}

export default {
  sendWelcomeEmail,
  sendInviteEmail,
  sendSOSAlert,
  sendDriveSummary,
  sendMembershipUpgrade,
  sendPaymentFailed,
};