import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

export interface CollaboratorInviteMailData {
  to: string;
  partner1Name: string;
  partner2Name: string;
  acceptUrl: string;
}

export interface InvitationMailData {
  to: string;
  guestName: string;
  partner1Name: string;
  partner2Name: string;
  weddingDate: string;
  weddingVenue: string;
  rsvpUrl: string;
}

@Injectable()
export class KtpMailerService {
  constructor(private readonly mailerService: MailerService) {}

  async sendNewLead(data: { to: string; email: string; date: string }): Promise<void> {
    await this.mailerService.sendMail({
      to: data.to,
      subject: `[KissthePlan] Nuevo lead Early Access: ${data.email}`,
      html: `
        <div style="font-family:Georgia,serif;background:#FAF7F2;padding:40px 20px;">
          <div style="background:#fff;max-width:480px;margin:0 auto;border-radius:16px;padding:40px;box-shadow:0 8px 32px rgba(74,60,50,0.08);">
            <p style="font-size:11px;text-transform:uppercase;letter-spacing:3px;opacity:.5;margin-bottom:6px;">Nuevo lead — Early Access</p>
            <p style="font-size:18px;font-weight:600;color:#c7a977;word-break:break-all;margin:0;">${data.email}</p>
            <p style="font-size:13px;opacity:.6;margin-top:16px;">
              Se ha registrado un nuevo interesado en KissthePlan.<br/>
              Fecha: ${data.date}
            </p>
            <div style="margin-top:32px;font-size:12px;opacity:.4;text-align:center;">KissthePlan · kisstheplan.com</div>
          </div>
        </div>
      `,
    });
  }

  async sendCollaboratorInvite(data: CollaboratorInviteMailData): Promise<void> {
    await this.mailerService.sendMail({
      to: data.to,
      subject: `Te han invitado a colaborar en la boda de ${data.partner1Name} & ${data.partner2Name}`,
      html: `
        <div style="font-family:Georgia,serif;background:#FAF7F2;padding:40px 20px;">
          <div style="background:#fff;max-width:520px;margin:0 auto;border-radius:16px;padding:48px;box-shadow:0 8px 32px rgba(74,60,50,0.08);border:1px solid #E6D8C8;">
            <p style="margin:0 0 6px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C4B7A6;">KissthePlan</p>
            <h1 style="margin:0 0 24px;font-size:28px;font-style:italic;color:#4A3C32;font-weight:400;">Te invitan a colaborar</h1>
            <p style="font-size:15px;line-height:1.7;color:#4A3C32;margin:0 0 20px;">
              Has sido invitado/a a ayudar en la organización de la boda de<br/>
              <strong style="color:#c7a977;">${data.partner1Name} &amp; ${data.partner2Name}</strong>.
            </p>
            <p style="font-size:14px;color:#8c6f5f;margin:0 0 32px;line-height:1.6;">
              Tendrás acceso completo a todos los módulos de planificación: invitados, presupuesto, proveedores, plano de mesas y mucho más.
            </p>
            <a href="${data.acceptUrl}" style="display:inline-block;background:#c7a977;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:14px 36px;border-radius:50px;letter-spacing:0.5px;">
              Aceptar invitación
            </a>
            <p style="margin:24px 0 0;font-size:12px;color:#C4B7A6;">
              Si el botón no funciona, copia este enlace:<br/>
              <a href="${data.acceptUrl}" style="color:#c7a977;word-break:break-all;">${data.acceptUrl}</a>
            </p>
            <div style="margin-top:32px;font-size:11px;color:#C4B7A6;text-align:center;">KissthePlan · kisstheplan.com</div>
          </div>
        </div>
      `,
    });
  }

  async sendInvitation(data: InvitationMailData): Promise<void> {
    await this.mailerService.sendMail({
      to: data.to,
      subject: `Invitación a la boda de ${data.partner1Name} & ${data.partner2Name}`,
      template: 'invitation',
      context: {
        guestName: data.guestName,
        partner1Name: data.partner1Name,
        partner2Name: data.partner2Name,
        weddingDate: data.weddingDate,
        weddingVenue: data.weddingVenue,
        rsvpUrl: data.rsvpUrl,
      },
    });
  }
}
