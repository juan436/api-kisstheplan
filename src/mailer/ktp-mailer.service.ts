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
