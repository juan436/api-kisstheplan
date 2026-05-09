import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

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
