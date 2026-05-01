import type { DecorationObject, CalibZone, CustomEmoji } from '../schemas/seating-plan.schema';

export interface PlanUpdateFields {
  name?: string;
  backgroundImageUrl?: string;
  scaleFactor?: number;
  decorations?: DecorationObject[];
  zones?: CalibZone[];
  customEmojis?: CustomEmoji[];
}
