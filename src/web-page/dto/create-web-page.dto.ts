import { IsString, IsOptional, IsBoolean, IsDateString, IsArray } from 'class-validator';

export class CreateWebPageDto {
  @IsOptional() @IsString() templateId?: string;
  @IsOptional() colorPalette?: Record<string, string>;
  @IsOptional() @IsString() fontTitle?: string;
  @IsOptional() @IsString() fontBody?: string;
}

export class UpdateWebPageDto {
  // Design
  @IsOptional() @IsString() templateId?: string;
  @IsOptional() colorPalette?: Record<string, string>;
  @IsOptional() @IsString() fontTitle?: string;
  @IsOptional() @IsString() fontBody?: string;
  @IsOptional() @IsString() heroImage?: string;
  @IsOptional() @IsArray() galleryImages?: string[];

  // RSVP
  @IsOptional() @IsBoolean() rsvpEnabled?: boolean;
  @IsOptional() @IsDateString() rsvpDeadline?: string;
  @IsOptional() @IsArray() mealOptions?: string[];
  @IsOptional() @IsArray() transportOptions?: string[];
  @IsOptional() @IsString() confirmMessage?: string;
  @IsOptional() @IsString() rejectMessage?: string;

  // Content
  @IsOptional() @IsString() heroTitle?: string;
  @IsOptional() @IsString() heroSubtitle?: string;
  @IsOptional() @IsString() storyTitle?: string;
  @IsOptional() @IsString() storyText?: string;
  @IsOptional() @IsString() scheduleTitle?: string;
  @IsOptional() @IsString() scheduleText?: string;
  @IsOptional() @IsString() scheduleStyle?: string;
  @IsOptional() @IsString() locationTitle?: string;
  @IsOptional() @IsString() locationText?: string;
  @IsOptional() @IsString() transportTitle?: string;
  @IsOptional() @IsString() transportText?: string;
  @IsOptional() @IsString() accommodationTitle?: string;
  @IsOptional() @IsString() accommodationText?: string;
  @IsOptional() @IsString() dressCodeTitle?: string;
  @IsOptional() @IsString() dressCode?: string;
  @IsOptional() @IsArray() customSections?: Array<{ title: string; content: string }>;
  @IsOptional() visibleSections?: Record<string, boolean>;
}

export class PublicRsvpDto {
  @IsString() guestName: string;
  @IsString() rsvpStatus: 'confirmed' | 'rejected';
  @IsOptional() @IsString() mealChoice?: string;
  @IsOptional() @IsString() allergies?: string;
  @IsOptional() @IsBoolean() transport?: boolean;
  @IsOptional() @IsString() transportPickupPoint?: string;
}
