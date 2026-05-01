import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Types } from 'mongoose';

export const CurrentWeddingId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => {
    const { wedding } = ctx.switchToHttp().getRequest<{ wedding: { _id: Types.ObjectId } }>();
    return wedding._id.toString();
  },
);
