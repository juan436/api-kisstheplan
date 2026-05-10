import { IsString, IsNotEmpty } from 'class-validator';

export class ExportSeatingPdfDto {
  @IsString() @IsNotEmpty()
  imageData: string;
}
