import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateNoteDto {
  @IsEnum(['text', 'pdf', 'moodboard']) type: string;
  @IsString() title: string;
  @IsOptional() @IsString() vendorId?: string;
  @IsOptional() @IsString() content?: string;
}

export class UpdateNoteDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() content?: string;
}

export class AddColorDto {
  @IsString() hexColor: string;
  @IsOptional() @IsString() name?: string;
}

export class AddCategoryDto {
  @IsString() name: string;
}

export class AddImageDto {
  @IsString() url: string;
  @IsOptional() @IsString() caption?: string;
}
